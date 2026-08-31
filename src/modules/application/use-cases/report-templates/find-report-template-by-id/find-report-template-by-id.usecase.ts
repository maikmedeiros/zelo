import { NotFoundError } from '@shared/errors/index.js';
import { ReportTemplateDetail } from '../../../../domain/entities/report-template.js';
import { IReportTemplateRepository } from '../../../../domain/repositories/i-report-template-repository.js';

export class FindReportTemplateByIdUseCase {
  constructor(private readonly templateRepo: IReportTemplateRepository) {}

  async execute(templateId: string, actorId: string): Promise<ReportTemplateDetail> {
    const template = await this.templateRepo.findById(templateId, actorId);

    if (!template) throw new NotFoundError({ message: 'Template não encontrado' });

    return template;
  }
}
