import {
  IReportRepository,
  ListReportsFilters,
  ListReportsResult,
} from '../../../../domain/repositories/i-report-repository.js';

export class FindListReportsUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(filters: ListReportsFilters): Promise<ListReportsResult> {
    return this.reportRepo.list(filters);
  }
}
