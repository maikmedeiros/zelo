import { db } from '@config/database.js';
import { DeleteReportUseCase } from '@modules/application/use-cases/reports/delete-report/delete-report.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { DeleteReportController } from '@modules/presentation/controllers/reports/delete-report/delete-report.controller.js';

export const makeDeleteReportController = (): DeleteReportController =>
  new DeleteReportController(new DeleteReportUseCase(new ReportRepository(db.core)));
