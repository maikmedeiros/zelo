import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { TeacherLink } from '../../domain/entities/teacher-link.js';
import {
  CreateTeacherLinkData,
  ITeacherLinkRepository,
  ListTeacherLinksFilters,
  ListTeacherLinksResult,
} from '../../domain/repositories/i-teacher-link-repository.js';
import {
  TeacherLinkMapper,
  TeacherLinkPersistenceRow,
} from '../../application/mappers/teacher-links/teacher-link-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { TURMA_NO_ESCOPO } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN professor pr ON pr.id = pt.professor_id
  INNER JOIN pessoa pes   ON pes.id = pr.pessoa_id
  INNER JOIN turma t      ON t.id = pt.turma_id
`;

// Quem alcança a turma alcança quem dá aula nela: `TURMA_NO_ESCOPO`, as três origens. Saber
// quem cuida do filho é justamente o que o responsável precisa, e não expõe criança nenhuma.
const FILTRO = `
  ${JOINS}
  WHERE t.escola_id = ${escolaDoAtor()}
    AND (@teacherId::uuid IS NULL OR pt.professor_id = @teacherId::uuid)
    AND (@classId::uuid IS NULL OR pt.turma_id = @classId::uuid)
    AND (
      @active::boolean IS NULL
      OR (@active::boolean AND pt.data_fim IS NULL)
      OR (NOT @active::boolean AND pt.data_fim IS NOT NULL)
    )
    AND (@viewerId::uuid IS NULL OR pt.turma_id IN (${TURMA_NO_ESCOPO}))
`;

const PROJECAO = `
  pt.id::text                            AS "ID",
  pt.professor_id::text                  AS "PROFESSOR_ID",
  pes.nome                               AS "NOME_PROFESSOR",
  pt.turma_id::text                      AS "TURMA_ID",
  t.nome                                 AS "NOME_TURMA",
  pt.funcao::text                        AS "FUNCAO",
  to_char(pt.data_inicio, 'YYYY-MM-DD')  AS "DATA_INICIO",
  to_char(pt.data_fim, 'YYYY-MM-DD')     AS "DATA_FIM"
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM professor_turma pt
  ${FILTRO}
  ORDER BY t.nome, pes.nome, pt.id
  LIMIT @limit::int OFFSET @offset::int;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM professor_turma pt
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM professor_turma pt
  ${JOINS}
  WHERE pt.id = @linkId::uuid
    AND t.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR pt.turma_id IN (${TURMA_NO_ESCOPO}));
`;

// `uq_professor_turma_ativo` é PARCIAL: voltar a lecionar numa turma de onde saiu é legítimo.
const INSERT = `
  INSERT INTO professor_turma (professor_id, turma_id, funcao, data_inicio)
  VALUES (
    @teacherId::uuid,
    @classId::uuid,
    @role::funcao_professor,
    coalesce(@startDate::date, CURRENT_DATE)
  )
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// Encerrar, não apagar: o vínculo passado é o que explica a autoria das postagens daquele
// professor naquela turma. E `visivelParaAtor` tem ramo de autoria justamente por isso.
const REVOKE = `
  UPDATE professor_turma pt
  SET data_fim = CURRENT_DATE
  WHERE pt.id = @linkId::uuid AND pt.data_fim IS NULL
  RETURNING pt.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class TeacherLinkRepository implements ITeacherLinkRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListTeacherLinksFilters): Promise<ListTeacherLinksResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      teacherId: filters.teacherId,
      classId: filters.classId,
      active: filters.active,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<TeacherLinkPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(TeacherLinkMapper.fromPersistence),
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
    linkId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<TeacherLink | null> {
    const rows = await this.db.query<TeacherLinkPersistenceRow>(SELECT_BY_ID, {
      linkId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? TeacherLinkMapper.fromPersistence(first) : null;
  }

  async create(data: CreateTeacherLinkData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      teacherId: data.teacherId,
      classId: data.classId,
      role: data.role,
      startDate: data.startDate,
    });

    return rows[0]?.ID ?? null;
  }

  async revoke(linkId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { linkId });
    return rows.length > 0;
  }
}
