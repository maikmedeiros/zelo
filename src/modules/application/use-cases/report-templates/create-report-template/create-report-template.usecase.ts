import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { ReportTemplateDetail } from '../../../../domain/entities/report-template.js';
import {
  CreateReportTemplateData,
  IReportTemplateRepository,
} from '../../../../domain/repositories/i-report-template-repository.js';

export class CreateReportTemplateUseCase {
  constructor(private readonly templateRepo: IReportTemplateRepository) {}

  async execute(data: CreateReportTemplateData): Promise<ReportTemplateDetail> {
    const templateId = await this.templateRepo.create(data);

    if (!templateId) {
      throw new ConflictError({
        message: 'Já existe um template com este nome na escola',
        cause: { campo: 'name' },
      });
    }

    const template = await this.templateRepo.findById(templateId, data.actorId);
    if (!template) throw new NotFoundError({ message: 'Template não encontrado' });

    return template;
  }
}
