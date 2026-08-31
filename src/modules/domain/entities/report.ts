export const REPORT_DIMENSIONS = [
  'ACOLHIMENTO',
  'ALIMENTACAO',
  'SONO',
  'SOCIALIZACAO',
  'AUTONOMIA',
  'LINGUAGEM',
  'DESENVOLVIMENTO_MOTOR',
] as const;

export type ReportDimension = (typeof REPORT_DIMENSIONS)[number];

export const REPORT_LEVELS = [
  'NAO_OBSERVADO',
  'EM_INICIO',
  'EM_DESENVOLVIMENTO',
  'CONSOLIDADO',
] as const;

export type ReportLevel = (typeof REPORT_LEVELS)[number];

export const REPORT_STATUSES = ['RASCUNHO', 'PUBLICADO'] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface ReportItem {
  id: string;
  dimension: ReportDimension;
  level: ReportLevel;
  note: string | null;
}

export interface Report {
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
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportDetail extends Report {
  synthesis: string | null;
  templateId: string | null;
  items: ReportItem[];
}

export interface ReportOwnership {
  id: string;
  authorId: string;
  studentId: string;
  classId: string;
  status: ReportStatus;
  hasContent: boolean;
}
