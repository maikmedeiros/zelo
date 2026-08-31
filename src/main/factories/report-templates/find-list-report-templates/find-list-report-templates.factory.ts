import { db } from '@config/database.js';
import { FindListReportTemplatesUseCase } from '@modules/application/use-cases/report-templates/find-list-report-templates/find-list-report-templates.usecase.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { FindListReportTemplatesController } from '@modules/presentation/controllers/report-templates/find-list-report-templates/find-list-report-templates.controller.js';

export const makeFindListReportTemplatesController = (): FindListReportTemplatesController =>
  new FindListReportTemplatesController(
    new FindListReportTemplatesUseCase(new ReportTemplateRepository(db.core)),
  );
