import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import {
  ReportTemplateDetail,
  ReportTemplateOwnership,
} from '../../domain/entities/report-template.js';
import { REPORT_DIMENSIONS } from '../../domain/entities/report.js';
import {
  CreateReportTemplateData,
  IReportTemplateRepository,
  ListReportTemplatesFilters,
  ListReportTemplatesResult,
  ReportTemplateItemData,
  UpdateReportTemplateData,
} from '../../domain/repositories/i-report-template-repository.js';
import {
  ReportTemplateDetailPersistenceRow,
  ReportTemplateMapper,
  ReportTemplatePersistenceRow,
} from '../../application/mappers/report-templates/report-template-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';

const JOINS = `
  INNER JOIN usuario u ON u.id = t.criado_por
  INNER JOIN pessoa pu ON pu.id = u.pessoa_id
`;

const FILTRO = `
  ${JOINS}
  WHERE t.ativo
    AND t.escola_id = ${escolaDoAtor()}
    AND (
      @search::text IS NULL
      OR t.nome ILIKE '%' || @search::text || '%'
      OR t.descricao ILIKE '%' || @search::text || '%'
    )
`;

const PROJECAO = `
  t.id::text          AS "ID",
  t.nome              AS "NOME",
  t.descricao         AS "DESCRICAO",
  t.criado_por::text  AS "CRIADO_POR",
  pu.nome             AS "NOME_AUTOR",
  (SELECT count(*) FROM relatorio_template_item ti WHERE ti.template_id = t.id)::int
                      AS "TOTAL_ITENS",
  t.criado_em         AS "CRIADO_EM",
  t.atualizado_em     AS "ATUALIZADO_EM"
`;

const ITENS_DO_TEMPLATE = `
  SELECT jsonb_agg(
           jsonb_build_object(
             'ID', ti.id::text,
             'DIMENSAO', ti.dimensao::text,
             'NIVEL', ti.nivel::text,
             'OBSERVACAO', ti.observacao
           )
           ORDER BY array_position(@dimensions::text[], ti.dimensao::text))
  FROM relatorio_template_item ti
  WHERE ti.template_id = t.id
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM relatorio_template t
  ${FILTRO}
  ORDER BY t.nome, t.id
  LIMIT @limit::int OFFSET @offset::int;
`;

const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM relatorio_template t
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT
    ${PROJECAO},
    t.sintese                AS "SINTESE",
    (${ITENS_DO_TEMPLATE})   AS "ITENS"
  FROM relatorio_template t
  ${JOINS}
  WHERE t.id = @templateId::uuid
    AND t.ativo
    AND t.escola_id = ${escolaDoAtor()};
`;

const SELECT_OWNERSHIP = `
  SELECT t.id::text AS "ID", t.criado_por::text AS "AUTOR_ID"
  FROM relatorio_template t
  WHERE t.id = @templateId::uuid
    AND t.ativo
    AND t.escola_id = ${escolaDoAtor()};
`;

const INSERT = `
  INSERT INTO relatorio_template (escola_id, nome, descricao, sintese, criado_por)
  SELECT ${escolaDoAtor()}, @name::text, @description::text, @synthesis::text, @authorId::uuid
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE relatorio_template t SET
    nome          = coalesce(@name::text, t.nome),
    descricao     = CASE WHEN @touchDescription::boolean THEN @description::text ELSE t.descricao END,
    sintese       = CASE WHEN @touchSynthesis::boolean THEN @synthesis::text ELSE t.sintese END,
    atualizado_em = now()
  WHERE t.id = @templateId::uuid
    AND t.ativo
    AND NOT EXISTS (
      SELECT 1 FROM relatorio_template outro
      WHERE outro.escola_id = t.escola_id
        AND outro.ativo
        AND lower(outro.nome) = lower(coalesce(@name::text, t.nome))
        AND outro.id <> t.id
    )
  RETURNING t.id::text AS "ID";
`;

const DELETE_ITENS = `
  DELETE FROM relatorio_template_item ti WHERE ti.template_id = @templateId::uuid;
`;

const INSERT_ITENS = `
  INSERT INTO relatorio_template_item (template_id, dimensao, nivel, observacao)
  SELECT
    @templateId::uuid,
    alvo.dimensao::dimensao_adaptacao,
    alvo.nivel::nivel_adaptacao,
    alvo.observacao
  FROM unnest(@dimensions::text[], @levels::text[], @notes::text[])
    AS alvo(dimensao, nivel, observacao)
  ON CONFLICT DO NOTHING;
`;

const SOFT_DELETE = `
  UPDATE relatorio_template t
  SET ativo = false, atualizado_em = now()
  WHERE t.id = @templateId::uuid AND t.ativo
  RETURNING t.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface OwnershipRow {
  ID: string;
  AUTOR_ID: string;
}

const colunasDosItens = (
  items: ReportTemplateItemData[],
): { dimensions: string[]; levels: (string | null)[]; notes: (string | null)[] } => ({
  dimensions: items.map((item) => item.dimension),
  levels: items.map((item) => item.level ?? null),
  notes: items.map((item) => item.note ?? null),
});

export class ReportTemplateRepository implements IReportTemplateRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListReportTemplatesFilters): Promise<ListReportTemplatesResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      search: filters.search,
      actorId: filters.actorId,
    };

    const rows = await this.db.query<ReportTemplatePersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(ReportTemplateMapper.fromPersistence),
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

  async findById(templateId: string, actorId: string): Promise<ReportTemplateDetail | null> {
    const rows = await this.db.query<ReportTemplateDetailPersistenceRow>(SELECT_BY_ID, {
      templateId,
      actorId,
      dimensions: [...REPORT_DIMENSIONS],
    });

    const row = rows[0];
    return row ? ReportTemplateMapper.detailFromPersistence(row) : null;
  }

  async findOwnership(
    templateId: string,
    actorId: string,
  ): Promise<ReportTemplateOwnership | null> {
    const rows = await this.db.query<OwnershipRow>(SELECT_OWNERSHIP, { templateId, actorId });
    const row = rows[0];
    return row ? { id: row.ID, authorId: row.AUTOR_ID } : null;
  }

  async create(data: CreateReportTemplateData): Promise<string | null> {
    return this.db.transaction(async () => {
      const rows = await this.db.query<IdRow>(INSERT, {
        name: data.name,
        description: data.description,
        synthesis: data.synthesis,
        authorId: data.authorId,
        actorId: data.actorId,
      });

      const row = rows[0];
      if (!row) return null;

      if (data.items.length > 0) {
        await this.db.query(INSERT_ITENS, {
          templateId: row.ID,
          ...colunasDosItens(data.items),
        });
      }

      return row.ID;
    });
  }

  async update(templateId: string, data: UpdateReportTemplateData): Promise<boolean> {
    return this.db.transaction(async () => {
      const rows = await this.db.query<IdRow>(UPDATE, {
        templateId,
        name: data.name ?? null,
        touchDescription: data.description !== undefined,
        description: data.description ?? null,
        touchSynthesis: data.synthesis !== undefined,
        synthesis: data.synthesis ?? null,
      });

      if (rows.length === 0) return false;

      if (data.items !== undefined) {
        await this.db.query(DELETE_ITENS, { templateId });

        if (data.items.length > 0) {
          await this.db.query(INSERT_ITENS, {
            templateId,
            ...colunasDosItens(data.items),
          });
        }
      }

      return true;
    });
  }

  async delete(templateId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(SOFT_DELETE, { templateId });
    return rows.length > 0;
  }
}
