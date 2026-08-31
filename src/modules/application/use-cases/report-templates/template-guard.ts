import { ReportTemplateOwnership } from '../../../domain/entities/report-template.js';

export type ReportTemplateGuard = (ownership: ReportTemplateOwnership) => boolean;
