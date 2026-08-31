import { db } from '@config/database.js';
import { FindReportByIdUseCase } from '@modules/application/use-cases/reports/find-report-by-id/find-report-by-id.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { FindReportByIdController } from '@modules/presentation/controllers/reports/find-report-by-id/find-report-by-id.controller.js';

export const makeFindReportByIdController = (): FindReportByIdController =>
  new FindReportByIdController(new FindReportByIdUseCase(new ReportRepository(db.core)));
