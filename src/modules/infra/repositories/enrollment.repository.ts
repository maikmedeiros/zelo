import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Enrollment } from '../../domain/entities/enrollment.js';
import {
  CreateEnrollmentData,
  IEnrollmentRepository,
  ListEnrollmentsFilters,
  ListEnrollmentsResult,
} from '../../domain/repositories/i-enrollment-repository.js';
import {
  EnrollmentMapper,
  EnrollmentPersistenceRow,
} from '../../application/mappers/enrollments/enrollment-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { alunoVisivelParaAtor } from './sql/turma-escopo.js';

const COLUNAS = (alias: string, pessoa: string, turma: string): string => `
  ${alias}.id::text                          AS "ID",
  ${alias}.aluno_id::text                    AS "ALUNO_ID",
  ${pessoa}.nome                             AS "NOME_ALUNO",
  ${alias}.turma_id::text                    AS "TURMA_ID",
  ${turma}.nome                              AS "NOME_TURMA",
  to_char(${alias}.data_inicio, 'YYYY-MM-DD') AS "DATA_INICIO",
  to_char(${alias}.data_fim, 'YYYY-MM-DD')    AS "DATA_FIM"
`;

const JOINS = `
  INNER JOIN aluno a    ON a.id = m.aluno_id
  INNER JOIN pessoa pes ON pes.id = a.pessoa_id
  INNER JOIN turma t    ON t.id = m.turma_id
`;

// Matrícula é dado da criança: o recorte é o mesmo de `GET /students`, e pelo mesmo motivo.
const FILTRO = `
  ${JOINS}
  WHERE pes.escola_id = ${escolaDoAtor()}
    AND (@studentId::uuid IS NULL OR m.aluno_id = @studentId::uuid)
    AND (@classId::uuid IS NULL OR m.turma_id = @classId::uuid)
    AND (
      @active::boolean IS NULL
      OR (@active::boolean AND m.data_fim IS NULL)
      OR (NOT @active::boolean AND m.data_fim IS NOT NULL)
    )
    AND (${alunoVisivelParaAtor('m.aluno_id')})
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT m.*, pes.nome AS nome_aluno, t.nome AS nome_turma, count(*) OVER () AS total_registro
    FROM matricula m
    ${FILTRO}
    ORDER BY m.data_inicio DESC, m.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    pagina.id::text                                             AS "ID",
    pagina.aluno_id::text                                       AS "ALUNO_ID",
    pagina.nome_aluno                                           AS "NOME_ALUNO",
    pagina.turma_id::text                                       AS "TURMA_ID",
    pagina.nome_turma                                           AS "NOME_TURMA",
    to_char(pagina.data_inicio, 'YYYY-MM-DD')                   AS "DATA_INICIO",
    to_char(pagina.data_fim, 'YYYY-MM-DD')                      AS "DATA_FIM",
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.data_inicio DESC, pagina.id;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM matricula m
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('m', 'pes', 't')}
  FROM matricula m
  ${JOINS}
  WHERE m.id = @enrollmentId::uuid
    AND pes.escola_id = ${escolaDoAtor()}
    AND (${alunoVisivelParaAtor('m.aluno_id')});
`;

// `uq_matricula_ativa` é índice PARCIAL (`WHERE data_fim IS NULL`): matricular de novo em
// turma da qual o aluno já saiu é legítimo e passa; matrícula vigente duplicada não.
const INSERT = `
  INSERT INTO matricula (aluno_id, turma_id, data_inicio)
  VALUES (@studentId::uuid, @classId::uuid, coalesce(@startDate::date, CURRENT_DATE))
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// Encerrar é preencher `data_fim`, nunca apagar: a matrícula passada é o que explica por que
// aquela criança aparece nas postagens do ano anterior.
const REVOKE = `
  UPDATE matricula m
  SET data_fim = coalesce(@endDate::date, CURRENT_DATE)
  WHERE m.id = @enrollmentId::uuid AND m.data_fim IS NULL
  RETURNING m.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class EnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListEnrollmentsFilters): Promise<ListEnrollmentsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      studentId: filters.studentId,
      classId: filters.classId,
      active: filters.active,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<EnrollmentPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(EnrollmentMapper.fromPersistence),
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
    enrollmentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Enrollment | null> {
    const rows = await this.db.query<EnrollmentPersistenceRow>(SELECT_BY_ID, {
      enrollmentId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? EnrollmentMapper.fromPersistence(first) : null;
  }

  async create(data: CreateEnrollmentData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      studentId: data.studentId,
      classId: data.classId,
      startDate: data.startDate,
    });

    return rows[0]?.ID ?? null;
  }

  async revoke(enrollmentId: string, endDate: string | null): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { enrollmentId, endDate });
    return rows.length > 0;
  }
}
