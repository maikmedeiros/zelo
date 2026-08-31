import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportTemplateParamsSchema } from '../../../../application/dtos/report-templates/find-report-template-by-id/input.js';
import { DeleteReportTemplateUseCase } from '../../../../application/use-cases/report-templates/delete-report-template/delete-report-template.usecase.js';
import { makeTemplateGuard } from '../template-guard.js';

export class DeleteReportTemplateController {
  constructor(private readonly useCase: DeleteReportTemplateUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { templateId } = reportTemplateParamsSchema.parse(request.params);

    await this.useCase.execute(
      templateId,
      actor.id,
      makeTemplateGuard(authz.can, actor, Feature.ReportTemplateDelete),
    );

    return { statusCode: 204 };
  }
}
