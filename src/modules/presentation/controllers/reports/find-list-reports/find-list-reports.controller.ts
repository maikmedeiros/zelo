import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListReportsSchema } from '../../../../application/dtos/reports/find-list-reports/input.js';
import {
  ReportMapper,
  ReportOutput,
} from '../../../../application/mappers/reports/report-mapper.js';
import { FindListReportsUseCase } from '../../../../application/use-cases/reports/find-list-reports/find-list-reports.usecase.js';

export class FindListReportsController {
  constructor(private readonly useCase: FindListReportsUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<ReportOutput>>> {
    const { actor } = request.context;
    const query = findListReportsSchema.parse(request.query);

    const viewerId = authz.scopesOf(actor, Feature.ReportView).includes('ESCOLA') ? null : actor.id;

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      studentId: query.studentId ?? null,
      classId: query.classId ?? null,
      status: query.status ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 200, body: paginated(items.map(ReportMapper.toOutput), pagination) };
  }
}
