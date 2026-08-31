import { db } from '@config/database.js';
import { UpdateReportTemplateUseCase } from '@modules/application/use-cases/report-templates/update-report-template/update-report-template.usecase.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { UpdateReportTemplateController } from '@modules/presentation/controllers/report-templates/update-report-template/update-report-template.controller.js';

export const makeUpdateReportTemplateController = (): UpdateReportTemplateController =>
  new UpdateReportTemplateController(
    new UpdateReportTemplateUseCase(new ReportTemplateRepository(db.core)),
  );
