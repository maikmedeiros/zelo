import { db } from '@config/database.js';
import { FindReportTemplateByIdUseCase } from '@modules/application/use-cases/report-templates/find-report-template-by-id/find-report-template-by-id.usecase.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { FindReportTemplateByIdController } from '@modules/presentation/controllers/report-templates/find-report-template-by-id/find-report-template-by-id.controller.js';

export const makeFindReportTemplateByIdController = (): FindReportTemplateByIdController =>
  new FindReportTemplateByIdController(
    new FindReportTemplateByIdUseCase(new ReportTemplateRepository(db.core)),
  );
