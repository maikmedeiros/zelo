import { db } from '@config/database.js';
import { DeleteReportTemplateUseCase } from '@modules/application/use-cases/report-templates/delete-report-template/delete-report-template.usecase.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { DeleteReportTemplateController } from '@modules/presentation/controllers/report-templates/delete-report-template/delete-report-template.controller.js';

export const makeDeleteReportTemplateController = (): DeleteReportTemplateController =>
  new DeleteReportTemplateController(
    new DeleteReportTemplateUseCase(new ReportTemplateRepository(db.core)),
  );
