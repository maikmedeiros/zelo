import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { RoleGrant } from '../../domain/entities/role-grant.js';
import {
  CreateRoleGrantData,
  IRoleGrantRepository,
  ListRoleGrantsFilters,
  ListRoleGrantsResult,
} from '../../domain/repositories/i-role-grant-repository.js';
import {
  RoleGrantMapper,
  RoleGrantPersistenceRow,
} from '../../application/mappers/role-grants/role-grant-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';

const JOINS = `
  INNER JOIN usuario u  ON u.id = up.usuario_id
  INNER JOIN pessoa pu  ON pu.id = u.pessoa_id
  INNER JOIN perfil f   ON f.id = up.perfil_id
  LEFT JOIN usuario ug  ON ug.id = up.concedido_por
  LEFT JOIN pessoa pg   ON pg.id = ug.pessoa_id
`;

const FILTRO = `
  ${JOINS}
  WHERE pu.escola_id = ${escolaDoAtor()}
    AND (@userId::uuid IS NULL OR up.usuario_id = @userId::uuid)
    AND (@roleId::uuid IS NULL OR up.perfil_id = @roleId::uuid)
    AND (
      @active::boolean IS NULL
      OR (@active::boolean AND up.data_fim IS NULL)
      OR (NOT @active::boolean AND up.data_fim IS NOT NULL)
    )
`;

const PROJECAO = `
  up.id::text                            AS "ID",
  up.usuario_id::text                    AS "USUARIO_ID",
  pu.nome                                AS "NOME_USUARIO",
  up.perfil_id::text                     AS "PERFIL_ID",
  f.codigo                               AS "CODIGO_PERFIL",
  f.nome                                 AS "NOME_PERFIL",
  up.concedido_por::text                 AS "CONCEDIDO_POR",
  pg.nome                                AS "NOME_CONCEDENTE",
  to_char(up.data_inicio, 'YYYY-MM-DD')  AS "DATA_INICIO",
  to_char(up.data_fim, 'YYYY-MM-DD')     AS "DATA_FIM"
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM usuario_perfil up
  ${FILTRO}
  ORDER BY pu.nome, f.codigo, up.id
  LIMIT @limit::int OFFSET @offset::int;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM usuario_perfil up
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM usuario_perfil up
  ${JOINS}
  WHERE up.id = @grantId::uuid
    AND pu.escola_id = ${escolaDoAtor()};
`;

// `uq_usuario_perfil_ativo` é PARCIAL: reconceder um perfil que já foi revogado é legítimo.
const INSERT = `
  INSERT INTO usuario_perfil (usuario_id, perfil_id, concedido_por, data_inicio)
  VALUES (
    @userId::uuid,
    @roleId::uuid,
    @grantedBy::uuid,
    coalesce(@startDate::date, CURRENT_DATE)
  )
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// Encerrar, não apagar: a concessão passada explica o que aquele usuário podia fazer na data
// em que fez. É a trilha que sustenta a auditoria de autorização.
const REVOKE = `
  UPDATE usuario_perfil up
  SET data_fim = CURRENT_DATE
  WHERE up.id = @grantId::uuid AND up.data_fim IS NULL
  RETURNING up.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class RoleGrantRepository implements IRoleGrantRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListRoleGrantsFilters): Promise<ListRoleGrantsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      userId: filters.userId,
      roleId: filters.roleId,
      active: filters.active,
      actorId: filters.actorId,
    };

    const rows = await this.db.query<RoleGrantPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(RoleGrantMapper.fromPersistence),
        pagination: paginationFromRow(first),
      };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(grantId: string, actorId: string): Promise<RoleGrant | null> {
    const rows = await this.db.query<RoleGrantPersistenceRow>(SELECT_BY_ID, { grantId, actorId });
    const first = rows[0];

    return first ? RoleGrantMapper.fromPersistence(first) : null;
  }

  async create(data: CreateRoleGrantData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      userId: data.userId,
      roleId: data.roleId,
      grantedBy: data.grantedBy,
      startDate: data.startDate,
    });

    return rows[0]?.ID ?? null;
  }

  async revoke(grantId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { grantId });
    return rows.length > 0;
  }
}
