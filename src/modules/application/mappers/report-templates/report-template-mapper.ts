import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import {
  ReportTemplate,
  ReportTemplateDetail,
  ReportTemplateItem,
} from '../../../domain/entities/report-template.js';
import { ReportDimension, ReportLevel } from '../../../domain/entities/report.js';

export interface ReportTemplateItemOutput {
  id: string;
  dimension: ReportDimension;
  level: ReportLevel | null;
  note: string | null;
}

export interface ReportTemplateOutput {
  id: string;
  name: string;
  description: string | null;
  authorId: string;
  authorName: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateDetailOutput extends ReportTemplateOutput {
  synthesis: string | null;
  items: ReportTemplateItemOutput[];
}

interface ItemRow {
  ID: string;
  DIMENSAO: ReportDimension;
  NIVEL: ReportLevel | null;
  OBSERVACAO: string | null;
}

export interface ReportTemplatePersistenceRow extends PaginatedRow {
  ID: string;
  NOME: string;
  DESCRICAO: string | null;
  CRIADO_POR: string;
  NOME_AUTOR: string;
  TOTAL_ITENS: number;
  CRIADO_EM: Date;
  ATUALIZADO_EM: Date;
}

export interface ReportTemplateDetailPersistenceRow extends ReportTemplatePersistenceRow {
  SINTESE: string | null;
  ITENS: ItemRow[] | null;
}

const toItem = (row: ItemRow): ReportTemplateItem => ({
  id: row.ID,
  dimension: row.DIMENSAO,
  level: row.NIVEL,
  note: row.OBSERVACAO,
});

export class ReportTemplateMapper {
  static fromPersistence(row: ReportTemplatePersistenceRow): ReportTemplate {
    return {
      id: row.ID,
      name: row.NOME,
      description: row.DESCRICAO,
      authorId: row.CRIADO_POR,
      authorName: formatPersonName(row.NOME_AUTOR),
      itemCount: Number(row.TOTAL_ITENS),
      createdAt: row.CRIADO_EM,
      updatedAt: row.ATUALIZADO_EM,
    };
  }

  static detailFromPersistence(row: ReportTemplateDetailPersistenceRow): ReportTemplateDetail {
    return {
      ...ReportTemplateMapper.fromPersistence(row),
      synthesis: row.SINTESE,
      items: (row.ITENS ?? []).map(toItem),
    };
  }

  static toOutput(template: ReportTemplate): ReportTemplateOutput {
    return {
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  static detailToOutput(template: ReportTemplateDetail): ReportTemplateDetailOutput {
    return {
      ...ReportTemplateMapper.toOutput(template),
      synthesis: template.synthesis,
      items: template.items,
    };
  }
}
