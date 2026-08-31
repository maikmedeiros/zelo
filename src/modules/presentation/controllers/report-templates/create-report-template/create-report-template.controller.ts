import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateReportTemplateInput } from '../../../../application/dtos/report-templates/create-report-template/input.js';
import {
  ReportTemplateDetailOutput,
  ReportTemplateMapper,
} from '../../../../application/mappers/report-templates/report-template-mapper.js';
import { CreateReportTemplateUseCase } from '../../../../application/use-cases/report-templates/create-report-template/create-report-template.usecase.js';

export class CreateReportTemplateController {
  constructor(private readonly useCase: CreateReportTemplateUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportTemplateDetailOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateReportTemplateInput;

    const template = await this.useCase.execute({
      name: input.name,
      description: input.description ?? null,
      synthesis: input.synthesis ?? null,
      items: input.items,
      authorId: actor.id,
      actorId: actor.id,
    });

    return { statusCode: 201, body: ReportTemplateMapper.detailToOutput(template) };
  }
}
