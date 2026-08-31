import { db } from '@config/database.js';
import { CreateReportUseCase } from '@modules/application/use-cases/reports/create-report/create-report.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { CreateReportController } from '@modules/presentation/controllers/reports/create-report/create-report.controller.js';

export const makeCreateReportController = (): CreateReportController =>
  new CreateReportController(
    new CreateReportUseCase(new ReportRepository(db.core), new ReportTemplateRepository(db.core)),
  );
