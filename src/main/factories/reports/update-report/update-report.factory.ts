import { db } from '@config/database.js';
import { UpdateReportUseCase } from '@modules/application/use-cases/reports/update-report/update-report.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { UpdateReportController } from '@modules/presentation/controllers/reports/update-report/update-report.controller.js';

export const makeUpdateReportController = (): UpdateReportController =>
  new UpdateReportController(new UpdateReportUseCase(new ReportRepository(db.core)));
