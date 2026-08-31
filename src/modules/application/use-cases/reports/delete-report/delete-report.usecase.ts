import { NotFoundError } from '@shared/errors/index.js';
import { IReportRepository } from '../../../../domain/repositories/i-report-repository.js';
import { ReportGuard } from '../report-guard.js';

export class DeleteReportUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(reportId: string, guard: ReportGuard): Promise<void> {
    const ownership = await this.reportRepo.findOwnership(reportId);

    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Relatório não encontrado' });
    }

    const removeu = await this.reportRepo.delete(reportId);
    if (!removeu) throw new NotFoundError({ message: 'Relatório não encontrado' });
  }
}
