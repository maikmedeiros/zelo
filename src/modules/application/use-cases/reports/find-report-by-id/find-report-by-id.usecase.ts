import { NotFoundError } from '@shared/errors/index.js';
import { ReportDetail } from '../../../../domain/entities/report.js';
import { IReportRepository } from '../../../../domain/repositories/i-report-repository.js';

export class FindReportByIdUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(reportId: string, actorId: string, viewerId: string | null): Promise<ReportDetail> {
    const report = await this.reportRepo.findById(reportId, actorId, viewerId);

    if (!report) throw new NotFoundError({ message: 'Relatório não encontrado' });

    return report;
  }
}
