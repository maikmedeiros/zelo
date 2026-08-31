import { ReportOwnership } from '../../../domain/entities/report.js';

export type ReportGuard = (ownership: ReportOwnership) => boolean;
