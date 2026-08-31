import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { ReportTemplateDetail } from '../../../../domain/entities/report-template.js';
import {
  IReportTemplateRepository,
  UpdateReportTemplateData,
} from '../../../../domain/repositories/i-report-template-repository.js';
import { ReportTemplateGuard } from '../template-guard.js';

export interface UpdateReportTemplateInput extends UpdateReportTemplateData {
  templateId: string;
  actorId: string;
  guard: ReportTemplateGuard;
}

export class UpdateReportTemplateUseCase {
  constructor(private readonly templateRepo: IReportTemplateRepository) {}

  async execute(input: UpdateReportTemplateInput): Promise<ReportTemplateDetail> {
    const ownership = await this.templateRepo.findOwnership(input.templateId, input.actorId);

    if (!ownership || !input.guard(ownership)) {
      throw new NotFoundError({ message: 'Template não encontrado' });
    }

    const alterou = await this.templateRepo.update(input.templateId, {
      name: input.name,
      description: input.description,
      synthesis: input.synthesis,
      items: input.items,
    });

    if (!alterou) {
      throw new ConflictError({
        message: 'Já existe um template com este nome na escola',
        cause: { name: input.name },
      });
    }

    const template = await this.templateRepo.findById(input.templateId, input.actorId);
    if (!template) {
      throw new InternalServerError({ message: 'Template alterado mas não relido' });
    }

    return template;
  }
}
