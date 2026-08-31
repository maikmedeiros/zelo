import { ReportDimension, ReportLevel } from './report.js';

export interface ReportTemplateItem {
  id: string;
  dimension: ReportDimension;
  level: ReportLevel | null;
  note: string | null;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  authorId: string;
  authorName: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplateDetail extends ReportTemplate {
  synthesis: string | null;
  items: ReportTemplateItem[];
}

export interface ReportTemplateOwnership {
  id: string;
  authorId: string;
}
