import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Role, RolePermission } from '../../domain/entities/role.js';
import {
  CreateRoleData,
  IRoleRepository,
  ListRolesFilters,
  ListRolesResult,
  UpdateRoleData,
} from '../../domain/repositories/i-role-repository.js';
import { RoleMapper, RolePersistenceRow } from '../../application/mappers/roles/role-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD } from './sql/vigencia.js';

const PERMISSOES = (alias: string): string => `
  SELECT jsonb_agg(
           jsonb_build_object('CODIGO', pm.codigo, 'ABRANGENCIA', pp.abrangencia)
           ORDER BY pm.codigo
         )
  FROM perfil_permissao pp
  INNER JOIN permissao pm ON pm.id = pp.permissao_id
  WHERE pp.perfil_id = ${alias}
`;

const COLUNAS = (alias: string): string => `
  ${alias}.id::text          AS "ID",
  ${alias}.codigo            AS "CODIGO",
  ${alias}.nome              AS "NOME",
  ${alias}.descricao         AS "DESCRICAO",
  ${alias}.sistema           AS "SISTEMA",
  (${PERMISSOES(`${alias}.id`)}) AS "PERMISSOES",
  (
    SELECT count(DISTINCT up.usuario_id) FROM usuario_perfil up
    WHERE up.perfil_id = ${alias}.id AND ${ACTIVE_PERIOD('up')}
  )::int                     AS "TOTAL_USUARIO"
`;

// `escola_id IS NULL` é o perfil de sistema global, que serve a todas as escolas — por isso
// entra na listagem ao lado dos da escola do ator.
const FILTRO = `
  WHERE (f.escola_id = ${escolaDoAtor()} OR f.escola_id IS NULL)
    AND (
      @search::text IS NULL
      OR f.codigo ILIKE '%' || @search::text || '%'
      OR f.nome ILIKE '%' || @search::text || '%'
    )
`;

const SELECT_LIST = `
  SELECT
    ${COLUNAS('f')},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM perfil f
  ${FILTRO}
  ORDER BY f.codigo
  LIMIT @limit::int OFFSET @offset::int;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM perfil f
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('f')}
  FROM perfil f
  WHERE f.id = @roleId::uuid
    AND (f.escola_id = ${escolaDoAtor()} OR f.escola_id IS NULL);
`;

// As capabilities pedidas que não existem no catálogo. Sem isto, um typo viraria um perfil
// com uma linha a menos e ninguém saberia — a mesma falha silenciosa que o `strictObject`
// dos corpos de escrita existe para impedir.
const SELECT_PERMISSOES_DESCONHECIDAS = `
  SELECT alvo.codigo AS "CODIGO"
  FROM unnest(@codes::text[]) AS alvo(codigo)
  WHERE NOT EXISTS (SELECT 1 FROM permissao pm WHERE pm.codigo = alvo.codigo);
`;

// `sistema` é sempre false: perfil de sistema nasce de migration, nunca da API.
const INSERT = `
  INSERT INTO perfil (escola_id, codigo, nome, descricao, sistema)
  VALUES (${escolaDoAtor()}, @code::text, @name::text, @description::text, false)
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE perfil f SET
    nome          = coalesce(@name::text, f.nome),
    descricao     = CASE WHEN @descriptionSet THEN @description::text ELSE f.descricao END,
    atualizado_em = now()
  WHERE f.id = @roleId::uuid AND NOT f.sistema
  RETURNING f.id::text AS "ID";
`;

const DELETE_PERMISSOES = `DELETE FROM perfil_permissao WHERE perfil_id = @roleId::uuid;`;

const INSERT_PERMISSOES = `
  INSERT INTO perfil_permissao (perfil_id, permissao_id, abrangencia)
  SELECT @roleId::uuid, pm.id, alvo.abrangencia::abrangencia
  FROM unnest(@codes::text[], @scopes::text[]) AS alvo(codigo, abrangencia)
  INNER JOIN permissao pm ON pm.codigo = alvo.codigo
  ON CONFLICT DO NOTHING;
`;

interface IdRow {
  ID: string;
}

interface CodeRow {
  CODIGO: string;
}

export class RoleRepository implements IRoleRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListRolesFilters): Promise<ListRolesResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      search: filters.search,
      actorId: filters.actorId,
    };

    const rows = await this.db.query<RolePersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return { items: rows.map(RoleMapper.fromPersistence), pagination: paginationFromRow(first) };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(roleId: string, actorId: string): Promise<Role | null> {
    const rows = await this.db.query<RolePersistenceRow>(SELECT_BY_ID, { roleId, actorId });
    const first = rows[0];

    return first ? RoleMapper.fromPersistence(first) : null;
  }

  async findUnknownPermissions(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return [];

    const rows = await this.db.query<CodeRow>(SELECT_PERMISSOES_DESCONHECIDAS, { codes });
    return rows.map((row) => row.CODIGO);
  }

  // Chamado dentro de uma transação: as queries são sequenciais de propósito, porque a
  // transação vive em UMA conexão e duas em paralelo se atropelariam no mesmo client.
  async create(data: CreateRoleData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      actorId: data.actorId,
      code: data.code,
      name: data.name,
      description: data.description,
    });

    const roleId = rows[0]?.ID;
    if (!roleId) return null;

    await this.replacePermissions(roleId, data.permissions);

    return roleId;
  }

  async update(roleId: string, data: UpdateRoleData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      roleId,
      name: data.name ?? null,
      description: data.description ?? null,
      descriptionSet: data.description !== undefined,
    });

    return rows.length > 0;
  }

  // Substituição, não acréscimo: o conjunto que chega é o conjunto final. Concessão que não
  // veio é concessão removida — senão não haveria como tirar uma permissão de um perfil.
  async replacePermissions(roleId: string, permissions: RolePermission[]): Promise<void> {
    await this.db.query(DELETE_PERMISSOES, { roleId });

    if (permissions.length === 0) return;

    await this.db.query(INSERT_PERMISSOES, {
      roleId,
      codes: permissions.map((permission) => permission.code),
      scopes: permissions.map((permission) => permission.scope),
    });
  }
}
