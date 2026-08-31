import { db } from '@config/database.js';
import { PublishReportUseCase } from '@modules/application/use-cases/reports/publish-report/publish-report.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { PublishReportController } from '@modules/presentation/controllers/reports/publish-report/publish-report.controller.js';

export const makePublishReportController = (): PublishReportController =>
  new PublishReportController(new PublishReportUseCase(new ReportRepository(db.core)));
