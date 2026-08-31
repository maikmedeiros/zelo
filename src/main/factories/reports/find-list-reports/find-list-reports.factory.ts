import { db } from '@config/database.js';
import { FindListReportsUseCase } from '@modules/application/use-cases/reports/find-list-reports/find-list-reports.usecase.js';
import { ReportRepository } from '@modules/infra/repositories/report.repository.js';
import { FindListReportsController } from '@modules/presentation/controllers/reports/find-list-reports/find-list-reports.controller.js';

export const makeFindListReportsController = (): FindListReportsController =>
  new FindListReportsController(new FindListReportsUseCase(new ReportRepository(db.core)));
