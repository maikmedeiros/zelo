import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { REPORT_DIMENSIONS, ReportDetail } from '../../../../domain/entities/report.js';
import { IReportRepository } from '../../../../domain/repositories/i-report-repository.js';
import { IReportTemplateRepository } from '../../../../domain/repositories/i-report-template-repository.js';

export interface CreateReportInput {
  studentId: string;
  periodStart: string;
  periodEnd: string;
  synthesis: string | null;
  templateId: string | null;
  actorId: string;
  viewerId: string | null;
}

export class CreateReportUseCase {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly templateRepo: IReportTemplateRepository,
  ) {}

  async execute(input: CreateReportInput): Promise<ReportDetail> {
    if (input.templateId !== null) {
      const template = await this.templateRepo.findById(input.templateId, input.actorId);

      if (!template) {
        throw new UnprocessableEntityError({
          message: 'Template não encontrado ou arquivado',
          cause: { campo: 'templateId' },
        });
      }
    }

    const reportId = await this.reportRepo.create({
      studentId: input.studentId,
      authorId: input.actorId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      synthesis: input.synthesis,
      templateId: input.templateId,
      dimensions: REPORT_DIMENSIONS,
      actorId: input.actorId,
      viewerId: input.viewerId,
    });

    if (!reportId) throw new NotFoundError({ message: 'Aluno não encontrado' });

    const report = await this.reportRepo.findById(reportId, input.actorId, null);
    if (!report) throw new NotFoundError({ message: 'Relatório não encontrado' });

    return report;
  }
}
