import {
  IReportTemplateRepository,
  ListReportTemplatesFilters,
  ListReportTemplatesResult,
} from '../../../../domain/repositories/i-report-template-repository.js';

export class FindListReportTemplatesUseCase {
  constructor(private readonly templateRepo: IReportTemplateRepository) {}

  async execute(filters: ListReportTemplatesFilters): Promise<ListReportTemplatesResult> {
    return this.templateRepo.list(filters);
  }
}
