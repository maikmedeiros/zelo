import { ReportDetail, ReportDimension, ReportLevel, ReportStatus } from '../entities/report.js';
import { Report, ReportOwnership } from '../entities/report.js';
import { PageInfo } from './pagination.js';

export interface ListReportsFilters {
  page: number;
  limit: number;
  studentId: string | null;
  classId: string | null;
  status: ReportStatus | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListReportsResult {
  items: Report[];
  pagination: PageInfo;
}

export interface CreateReportData {
  studentId: string;
  authorId: string;
  periodStart: string;
  periodEnd: string;
  synthesis: string | null;
  templateId: string | null;
  dimensions: readonly ReportDimension[];
  actorId: string;
  viewerId: string | null;
}

export interface UpdateReportItemData {
  dimension: ReportDimension;
  level?: ReportLevel;
  note?: string | null;
}

export interface UpdateReportData {
  synthesis?: string | null;
  periodStart?: string;
  periodEnd?: string;
  items?: UpdateReportItemData[];
}

export interface IReportRepository {
  list(filters: ListReportsFilters): Promise<ListReportsResult>;
  findById(
    reportId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<ReportDetail | null>;
  findOwnership(reportId: string): Promise<ReportOwnership | null>;
  create(data: CreateReportData): Promise<string | null>;
  update(reportId: string, data: UpdateReportData): Promise<boolean>;
  publish(reportId: string): Promise<boolean>;
  delete(reportId: string): Promise<boolean>;
}
