import { ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { ReportDetail } from '../../../../domain/entities/report.js';
import { IReportRepository } from '../../../../domain/repositories/i-report-repository.js';
import { ReportGuard } from '../report-guard.js';

export class PublishReportUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(reportId: string, actorId: string, guard: ReportGuard): Promise<ReportDetail> {
    const ownership = await this.reportRepo.findOwnership(reportId);

    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Relatório não encontrado' });
    }

    if (ownership.status !== 'RASCUNHO') {
      throw new ConflictError({ message: 'Relatório já publicado' });
    }

    if (!ownership.hasContent) {
      throw new UnprocessableEntityError({
        message: 'Relatório publicado precisa de síntese ou de ao menos uma dimensão observada',
      });
    }

    const publicou = await this.reportRepo.publish(reportId);
    if (!publicou) throw new NotFoundError({ message: 'Relatório não encontrado' });

    const report = await this.reportRepo.findById(reportId, actorId, null);
    if (!report) throw new NotFoundError({ message: 'Relatório não encontrado' });

    return report;
  }
}
