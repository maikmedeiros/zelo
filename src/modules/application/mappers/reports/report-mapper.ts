import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import {
  Report,
  ReportDetail,
  ReportDimension,
  ReportItem,
  ReportLevel,
  ReportStatus,
} from '../../../domain/entities/report.js';

export interface ReportItemOutput {
  id: string;
  dimension: ReportDimension;
  level: ReportLevel;
  note: string | null;
}

export interface ReportOutput {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  authorId: string;
  authorName: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetailOutput extends ReportOutput {
  synthesis: string | null;
  templateId: string | null;
  items: ReportItemOutput[];
}

interface ItemRow {
  ID: string;
  DIMENSAO: ReportDimension;
  NIVEL: ReportLevel;
  OBSERVACAO: string | null;
}

export interface ReportPersistenceRow extends PaginatedRow {
  ID: string;
  ALUNO_ID: string;
  NOME_ALUNO: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  AUTOR_ID: string;
  NOME_AUTOR: string;
  PERIODO_INICIO: string;
  PERIODO_FIM: string;
  STATUS: ReportStatus;
  PUBLICADO_EM: Date | null;
  CRIADO_EM: Date;
  ATUALIZADO_EM: Date;
}

export interface ReportDetailPersistenceRow extends ReportPersistenceRow {
  SINTESE: string | null;
  TEMPLATE_ORIGEM_ID: string | null;
  ITENS: ItemRow[] | null;
}

const toItem = (row: ItemRow): ReportItem => ({
  id: row.ID,
  dimension: row.DIMENSAO,
  level: row.NIVEL,
  note: row.OBSERVACAO,
});

export class ReportMapper {
  static fromPersistence(row: ReportPersistenceRow): Report {
    return {
      id: row.ID,
      studentId: row.ALUNO_ID,
      studentName: formatPersonName(row.NOME_ALUNO),
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      authorId: row.AUTOR_ID,
      authorName: formatPersonName(row.NOME_AUTOR),
      periodStart: row.PERIODO_INICIO,
      periodEnd: row.PERIODO_FIM,
      status: row.STATUS,
      publishedAt: row.PUBLICADO_EM,
      createdAt: row.CRIADO_EM,
      updatedAt: row.ATUALIZADO_EM,
    };
  }

  static detailFromPersistence(row: ReportDetailPersistenceRow): ReportDetail {
    return {
      ...ReportMapper.fromPersistence(row),
      synthesis: row.SINTESE,
      templateId: row.TEMPLATE_ORIGEM_ID,
      items: (row.ITENS ?? []).map(toItem),
    };
  }

  static toOutput(report: Report): ReportOutput {
    return {
      ...report,
      publishedAt: report.publishedAt?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  static detailToOutput(report: ReportDetail): ReportDetailOutput {
    return {
      ...ReportMapper.toOutput(report),
      synthesis: report.synthesis,
      templateId: report.templateId,
      items: report.items,
    };
  }
}
