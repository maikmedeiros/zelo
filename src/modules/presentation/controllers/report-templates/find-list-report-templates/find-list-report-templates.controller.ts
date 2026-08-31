import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListReportTemplatesSchema } from '../../../../application/dtos/report-templates/find-list-report-templates/input.js';
import {
  ReportTemplateMapper,
  ReportTemplateOutput,
} from '../../../../application/mappers/report-templates/report-template-mapper.js';
import { FindListReportTemplatesUseCase } from '../../../../application/use-cases/report-templates/find-list-report-templates/find-list-report-templates.usecase.js';

export class FindListReportTemplatesController {
  constructor(private readonly useCase: FindListReportTemplatesUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<ReportTemplateOutput>>> {
    const { actor } = request.context;
    const query = findListReportTemplatesSchema.parse(request.query);

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search ?? null,
      actorId: actor.id,
    });

    return {
      statusCode: 200,
      body: paginated(items.map(ReportTemplateMapper.toOutput), pagination),
    };
  }
}
