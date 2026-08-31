import { db } from '@config/database.js';
import { CreateReportTemplateUseCase } from '@modules/application/use-cases/report-templates/create-report-template/create-report-template.usecase.js';
import { ReportTemplateRepository } from '@modules/infra/repositories/report-template.repository.js';
import { CreateReportTemplateController } from '@modules/presentation/controllers/report-templates/create-report-template/create-report-template.controller.js';

export const makeCreateReportTemplateController = (): CreateReportTemplateController =>
  new CreateReportTemplateController(
    new CreateReportTemplateUseCase(new ReportTemplateRepository(db.core)),
  );
