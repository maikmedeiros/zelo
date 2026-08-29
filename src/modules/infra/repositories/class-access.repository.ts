import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { ClassAccess } from '../../domain/entities/class-access.js';
import {
  CreateClassAccessData,
  IClassAccessRepository,
  ListClassAccessesFilters,
  ListClassAccessesResult,
} from '../../domain/repositories/i-class-access-repository.js';
import {
  ClassAccessMapper,
  ClassAccessPersistenceRow,
} from '../../application/mappers/class-accesses/class-access-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { TURMA_NO_ESCOPO } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN usuario u    ON u.id = ac.usuario_id
  INNER JOIN pessoa pu    ON pu.id = u.pessoa_id
  INNER JOIN turma t      ON t.id = ac.turma_id
  INNER JOIN usuario ug   ON ug.id = ac.concedido_por
  INNER JOIN pessoa pg    ON pg.id = ug.pessoa_id
`;

const FILTRO = `
  ${JOINS}
  WHERE t.escola_id = ${escolaDoAtor()}
    AND (@userId::uuid IS NULL OR ac.usuario_id = @userId::uuid)
    AND (@classId::uuid IS NULL OR ac.turma_id = @classId::uuid)
    AND (
      @active::boolean IS NULL
      OR (@active::boolean AND ac.data_fim IS NULL)
      OR (NOT @active::boolean AND ac.data_fim IS NOT NULL)
    )
    AND (@viewerId::uuid IS NULL OR ac.turma_id IN (${TURMA_NO_ESCOPO}))
`;

const PROJECAO = `
  ac.id::text                            AS "ID",
  ac.usuario_id::text                    AS "USUARIO_ID",
  pu.nome                                AS "NOME_USUARIO",
  ac.turma_id::text                      AS "TURMA_ID",
  t.nome                                 AS "NOME_TURMA",
  ac.motivo::text                        AS "MOTIVO",
  ac.justificativa                       AS "JUSTIFICATIVA",
  ac.concedido_por::text                 AS "CONCEDIDO_POR",
  pg.nome                                AS "NOME_CONCEDENTE",
  to_char(ac.data_inicio, 'YYYY-MM-DD')  AS "DATA_INICIO",
  to_char(ac.data_fim, 'YYYY-MM-DD')     AS "DATA_FIM"
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM acesso_turma ac
  ${FILTRO}
  ORDER BY ac.data_inicio DESC, ac.id
  LIMIT @limit::int OFFSET @offset::int;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM acesso_turma ac
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM acesso_turma ac
  ${JOINS}
  WHERE ac.id = @accessId::uuid
    AND t.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR ac.turma_id IN (${TURMA_NO_ESCOPO}));
`;

// `concedido_por` sai do ator, nunca do corpo: este acesso é uma decisão administrativa, e
// quem a tomou tem de ficar registrado com o próprio id.
const INSERT = `
  INSERT INTO acesso_turma
    (usuario_id, turma_id, motivo, concedido_por, justificativa, data_inicio)
  VALUES (
    @userId::uuid,
    @classId::uuid,
    @reason::motivo_acesso_turma,
    @grantedBy::uuid,
    @justification::text,
    coalesce(@startDate::date, CURRENT_DATE)
  )
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// Encerrar, não apagar: o acesso passado é a trilha de auditoria de quem viu o quê e por quê.
const REVOKE = `
  UPDATE acesso_turma ac
  SET data_fim = CURRENT_DATE
  WHERE ac.id = @accessId::uuid AND ac.data_fim IS NULL
  RETURNING ac.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class ClassAccessRepository implements IClassAccessRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListClassAccessesFilters): Promise<ListClassAccessesResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      userId: filters.userId,
      classId: filters.classId,
      active: filters.active,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<ClassAccessPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(ClassAccessMapper.fromPersistence),
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

  async findById(
    accessId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<ClassAccess | null> {
    const rows = await this.db.query<ClassAccessPersistenceRow>(SELECT_BY_ID, {
      accessId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? ClassAccessMapper.fromPersistence(first) : null;
  }

  async create(data: CreateClassAccessData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      userId: data.userId,
      classId: data.classId,
      reason: data.reason,
      justification: data.justification,
      startDate: data.startDate,
      grantedBy: data.grantedBy,
    });

    return rows[0]?.ID ?? null;
  }

  async revoke(accessId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { accessId });
    return rows.length > 0;
  }
}
