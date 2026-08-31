import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportTemplateParamsSchema } from '../../../../application/dtos/report-templates/find-report-template-by-id/input.js';
import { UpdateReportTemplateInput } from '../../../../application/dtos/report-templates/update-report-template/input.js';
import {
  ReportTemplateDetailOutput,
  ReportTemplateMapper,
} from '../../../../application/mappers/report-templates/report-template-mapper.js';
import { UpdateReportTemplateUseCase } from '../../../../application/use-cases/report-templates/update-report-template/update-report-template.usecase.js';
import { makeTemplateGuard } from '../template-guard.js';

export class UpdateReportTemplateController {
  constructor(private readonly useCase: UpdateReportTemplateUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportTemplateDetailOutput>> {
    const { actor } = request.context;
    const { templateId } = reportTemplateParamsSchema.parse(request.params);
    const input = request.body as UpdateReportTemplateInput;

    const template = await this.useCase.execute({
      templateId,
      name: input.name,
      description: input.description,
      synthesis: input.synthesis,
      items: input.items,
      actorId: actor.id,
      guard: makeTemplateGuard(authz.can, actor, Feature.ReportTemplateUpdate),
    });

    return { statusCode: 200, body: ReportTemplateMapper.detailToOutput(template) };
  }
}
