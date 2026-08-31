import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import {
  REPORT_DIMENSIONS,
  ReportDetail,
  ReportOwnership,
  ReportStatus,
} from '../../domain/entities/report.js';
import {
  CreateReportData,
  IReportRepository,
  ListReportsFilters,
  ListReportsResult,
  UpdateReportData,
} from '../../domain/repositories/i-report-repository.js';
import {
  ReportDetailPersistenceRow,
  ReportMapper,
  ReportPersistenceRow,
} from '../../application/mappers/reports/report-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, TURMA_DA_EQUIPE, alunoVisivelParaAtor } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN aluno al   ON al.id = r.aluno_id
  INNER JOIN pessoa pa  ON pa.id = al.pessoa_id
  INNER JOIN turma t    ON t.id = r.turma_id
  INNER JOIN usuario u  ON u.id = r.autor_id
  INNER JOIN pessoa pu  ON pu.id = u.pessoa_id
`;

const ALCANCA_O_ATOR = `
  @viewerId::uuid IS NULL
  OR r.status = 'PUBLICADO'
  OR r.autor_id = @viewerId::uuid
  OR r.turma_id IN (${TURMA_DA_EQUIPE})
`;

const FILTRO = `
  ${JOINS}
  WHERE pa.escola_id = ${escolaDoAtor()}
    AND (@studentId::uuid IS NULL OR r.aluno_id = @studentId::uuid)
    AND (@classId::uuid IS NULL OR r.turma_id = @classId::uuid)
    AND (@status::text IS NULL OR r.status = @status::status_relatorio)
    AND (${ALCANCA_O_ATOR})
    AND (${alunoVisivelParaAtor('r.aluno_id')})
`;

const PROJECAO = `
  r.id::text                                  AS "ID",
  r.aluno_id::text                            AS "ALUNO_ID",
  pa.nome                                     AS "NOME_ALUNO",
  r.turma_id::text                            AS "TURMA_ID",
  t.nome                                      AS "NOME_TURMA",
  r.autor_id::text                            AS "AUTOR_ID",
  pu.nome                                     AS "NOME_AUTOR",
  to_char(r.periodo_inicio, 'YYYY-MM-DD')     AS "PERIODO_INICIO",
  to_char(r.periodo_fim, 'YYYY-MM-DD')        AS "PERIODO_FIM",
  r.status::text                              AS "STATUS",
  r.publicado_em                              AS "PUBLICADO_EM",
  r.criado_em                                 AS "CRIADO_EM",
  r.atualizado_em                             AS "ATUALIZADO_EM"
`;

const ITENS_DO_RELATORIO = `
  SELECT jsonb_agg(
           jsonb_build_object(
             'ID', ri.id::text,
             'DIMENSAO', ri.dimensao::text,
             'NIVEL', ri.nivel::text,
             'OBSERVACAO', ri.observacao
           )
           ORDER BY array_position(@dimensions::text[], ri.dimensao::text))
  FROM relatorio_item ri
  WHERE ri.relatorio_id = r.id
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM relatorio r
  ${FILTRO}
  ORDER BY r.periodo_inicio DESC, pa.nome, r.id
  LIMIT @limit::int OFFSET @offset::int;
`;

const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM relatorio r
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT
    ${PROJECAO},
    r.sintese                       AS "SINTESE",
    r.template_origem_id::text      AS "TEMPLATE_ORIGEM_ID",
    (${ITENS_DO_RELATORIO})         AS "ITENS"
  FROM relatorio r
  ${JOINS}
  WHERE r.id = @reportId::uuid
    AND pa.escola_id = ${escolaDoAtor()}
    AND (${ALCANCA_O_ATOR})
    AND (${alunoVisivelParaAtor('r.aluno_id')});
`;

const SELECT_OWNERSHIP = `
  SELECT
    r.id::text       AS "ID",
    r.autor_id::text AS "AUTOR_ID",
    r.aluno_id::text AS "ALUNO_ID",
    r.turma_id::text AS "TURMA_ID",
    r.status::text   AS "STATUS",
    (
      (r.sintese IS NOT NULL AND btrim(r.sintese) <> '')
      OR EXISTS (
        SELECT 1 FROM relatorio_item ri
        WHERE ri.relatorio_id = r.id
          AND (ri.nivel <> 'NAO_OBSERVADO'
               OR (ri.observacao IS NOT NULL AND btrim(ri.observacao) <> ''))
      )
    ) AS "TEM_CONTEUDO"
  FROM relatorio r
  WHERE r.id = @reportId::uuid;
`;

const INSERT = `
  WITH modelo AS (
    SELECT t.id, t.sintese
    FROM relatorio_template t
    WHERE t.id = @templateId::uuid AND t.ativo
  ),
  turma_alvo AS (
    SELECT m.turma_id
    FROM matricula m
    INNER JOIN aluno al  ON al.id = m.aluno_id
    INNER JOIN pessoa pa ON pa.id = al.pessoa_id
    WHERE m.aluno_id = @studentId::uuid
      AND ${ACTIVE_PERIOD('m')}
      AND pa.escola_id = ${escolaDoAtor()}
      AND (@viewerId::uuid IS NULL OR m.turma_id IN (${TURMA_DA_EQUIPE}))
    ORDER BY m.data_inicio DESC
    LIMIT 1
  )
  INSERT INTO relatorio
    (aluno_id, turma_id, autor_id, periodo_inicio, periodo_fim, sintese, template_origem_id)
  SELECT
    @studentId::uuid,
    turma_alvo.turma_id,
    @authorId::uuid,
    @periodStart::date,
    @periodEnd::date,
    coalesce(@synthesis::text, (SELECT sintese FROM modelo)),
    (SELECT id FROM modelo)
  FROM turma_alvo
  RETURNING id::text AS "ID";
`;

const INSERT_ITENS = `
  INSERT INTO relatorio_item (relatorio_id, dimensao, nivel, observacao)
  SELECT
    @reportId::uuid,
    alvo.dimensao::dimensao_adaptacao,
    coalesce(ti.nivel, 'NAO_OBSERVADO'),
    ti.observacao
  FROM unnest(@dimensions::text[]) AS alvo(dimensao)
  LEFT JOIN relatorio_template_item ti
    ON ti.template_id = @templateId::uuid
   AND ti.dimensao = alvo.dimensao::dimensao_adaptacao
  ON CONFLICT DO NOTHING;
`;

const UPDATE = `
  UPDATE relatorio r SET
    sintese        = CASE WHEN @touchSynthesis::boolean THEN @synthesis::text ELSE r.sintese END,
    periodo_inicio = coalesce(@periodStart::date, r.periodo_inicio),
    periodo_fim    = coalesce(@periodEnd::date, r.periodo_fim),
    atualizado_em  = now()
  WHERE r.id = @reportId::uuid
  RETURNING r.id::text AS "ID";
`;

const UPDATE_ITEM = `
  UPDATE relatorio_item ri SET
    nivel      = coalesce(@level::nivel_adaptacao, ri.nivel),
    observacao = CASE WHEN @touchNote::boolean THEN @note::text ELSE ri.observacao END
  WHERE ri.relatorio_id = @reportId::uuid
    AND ri.dimensao = @dimension::dimensao_adaptacao
  RETURNING ri.id::text AS "ID";
`;

const PUBLISH = `
  UPDATE relatorio r SET
    status        = 'PUBLICADO',
    publicado_em  = now(),
    atualizado_em = now()
  WHERE r.id = @reportId::uuid AND r.status = 'RASCUNHO'
  RETURNING r.id::text AS "ID";
`;

const DELETE = `
  DELETE FROM relatorio r
  WHERE r.id = @reportId::uuid
  RETURNING r.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface OwnershipRow {
  ID: string;
  AUTOR_ID: string;
  ALUNO_ID: string;
  TURMA_ID: string;
  STATUS: ReportStatus;
  TEM_CONTEUDO: boolean;
}

export class ReportRepository implements IReportRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListReportsFilters): Promise<ListReportsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      studentId: filters.studentId,
      classId: filters.classId,
      status: filters.status,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<ReportPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(ReportMapper.fromPersistence),
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
    reportId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<ReportDetail | null> {
    const rows = await this.db.query<ReportDetailPersistenceRow>(SELECT_BY_ID, {
      reportId,
      actorId,
      viewerId,
      dimensions: [...REPORT_DIMENSIONS],
    });

    const row = rows[0];
    return row ? ReportMapper.detailFromPersistence(row) : null;
  }

  async findOwnership(reportId: string): Promise<ReportOwnership | null> {
    const rows = await this.db.query<OwnershipRow>(SELECT_OWNERSHIP, { reportId });
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.ID,
      authorId: row.AUTOR_ID,
      studentId: row.ALUNO_ID,
      classId: row.TURMA_ID,
      status: row.STATUS,
      hasContent: row.TEM_CONTEUDO,
    };
  }

  async create(data: CreateReportData): Promise<string | null> {
    return this.db.transaction(async () => {
      const rows = await this.db.query<IdRow>(INSERT, {
        studentId: data.studentId,
        authorId: data.authorId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        synthesis: data.synthesis,
        templateId: data.templateId,
        actorId: data.actorId,
        viewerId: data.viewerId,
      });

      const row = rows[0];
      if (!row) return null;

      await this.db.query(INSERT_ITENS, {
        reportId: row.ID,
        dimensions: [...data.dimensions],
        templateId: data.templateId,
      });

      return row.ID;
    });
  }

  async update(reportId: string, data: UpdateReportData): Promise<boolean> {
    return this.db.transaction(async () => {
      const rows = await this.db.query<IdRow>(UPDATE, {
        reportId,
        touchSynthesis: data.synthesis !== undefined,
        synthesis: data.synthesis ?? null,
        periodStart: data.periodStart ?? null,
        periodEnd: data.periodEnd ?? null,
      });

      if (rows.length === 0) return false;

      for (const item of data.items ?? []) {
        await this.db.query(UPDATE_ITEM, {
          reportId,
          dimension: item.dimension,
          level: item.level ?? null,
          touchNote: item.note !== undefined,
          note: item.note ?? null,
        });
      }

      return true;
    });
  }

  async publish(reportId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(PUBLISH, { reportId });
    return rows.length > 0;
  }

  async delete(reportId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { reportId });
    return rows.length > 0;
  }
}
