import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportTemplateParamsSchema } from '../../../../application/dtos/report-templates/find-report-template-by-id/input.js';
import {
  ReportTemplateDetailOutput,
  ReportTemplateMapper,
} from '../../../../application/mappers/report-templates/report-template-mapper.js';
import { FindReportTemplateByIdUseCase } from '../../../../application/use-cases/report-templates/find-report-template-by-id/find-report-template-by-id.usecase.js';

export class FindReportTemplateByIdController {
  constructor(private readonly useCase: FindReportTemplateByIdUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportTemplateDetailOutput>> {
    const { actor } = request.context;
    const { templateId } = reportTemplateParamsSchema.parse(request.params);

    const template = await this.useCase.execute(templateId, actor.id);

    return { statusCode: 200, body: ReportTemplateMapper.detailToOutput(template) };
  }
}
