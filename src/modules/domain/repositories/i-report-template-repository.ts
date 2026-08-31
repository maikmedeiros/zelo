import {
  ReportTemplate,
  ReportTemplateDetail,
  ReportTemplateOwnership,
} from '../entities/report-template.js';
import { ReportDimension, ReportLevel } from '../entities/report.js';
import { PageInfo } from './pagination.js';

export interface ListReportTemplatesFilters {
  page: number;
  limit: number;
  search: string | null;
  actorId: string;
}

export interface ListReportTemplatesResult {
  items: ReportTemplate[];
  pagination: PageInfo;
}

export interface ReportTemplateItemData {
  dimension: ReportDimension;
  level?: ReportLevel | null;
  note?: string | null;
}

export interface CreateReportTemplateData {
  name: string;
  description: string | null;
  synthesis: string | null;
  items: ReportTemplateItemData[];
  authorId: string;
  actorId: string;
}

export interface UpdateReportTemplateData {
  name?: string;
  description?: string | null;
  synthesis?: string | null;
  items?: ReportTemplateItemData[];
}

export interface IReportTemplateRepository {
  list(filters: ListReportTemplatesFilters): Promise<ListReportTemplatesResult>;
  findById(templateId: string, actorId: string): Promise<ReportTemplateDetail | null>;
  findOwnership(templateId: string, actorId: string): Promise<ReportTemplateOwnership | null>;
  create(data: CreateReportTemplateData): Promise<string | null>;
  update(templateId: string, data: UpdateReportTemplateData): Promise<boolean>;
  delete(templateId: string): Promise<boolean>;
}
