import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { ReportDetail } from '../../../../domain/entities/report.js';
import {
  IReportRepository,
  UpdateReportData,
} from '../../../../domain/repositories/i-report-repository.js';
import { ReportGuard } from '../report-guard.js';

export interface UpdateReportInput extends UpdateReportData {
  reportId: string;
  actorId: string;
  guard: ReportGuard;
}

export class UpdateReportUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(input: UpdateReportInput): Promise<ReportDetail> {
    const ownership = await this.reportRepo.findOwnership(input.reportId);

    if (!ownership || !input.guard(ownership)) {
      throw new NotFoundError({ message: 'Relatório não encontrado' });
    }

    if (ownership.status !== 'RASCUNHO') {
      throw new ConflictError({
        message: 'Relatório publicado não é alterado — a família já recebeu esta versão',
      });
    }

    const alterou = await this.reportRepo.update(input.reportId, {
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      synthesis: input.synthesis,
      items: input.items,
    });

    if (!alterou) throw new NotFoundError({ message: 'Relatório não encontrado' });

    const report = await this.reportRepo.findById(input.reportId, input.actorId, null);
    if (!report) throw new NotFoundError({ message: 'Relatório não encontrado' });

    return report;
  }
}
