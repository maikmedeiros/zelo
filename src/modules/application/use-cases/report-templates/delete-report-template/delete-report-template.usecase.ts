import { NotFoundError } from '@shared/errors/index.js';
import { IReportTemplateRepository } from '../../../../domain/repositories/i-report-template-repository.js';
import { ReportTemplateGuard } from '../template-guard.js';

export class DeleteReportTemplateUseCase {
  constructor(private readonly templateRepo: IReportTemplateRepository) {}

  async execute(templateId: string, actorId: string, guard: ReportTemplateGuard): Promise<void> {
    const ownership = await this.templateRepo.findOwnership(templateId, actorId);

    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Template não encontrado' });
    }

    const removeu = await this.templateRepo.delete(templateId);
    if (!removeu) throw new NotFoundError({ message: 'Template não encontrado' });
  }
}
