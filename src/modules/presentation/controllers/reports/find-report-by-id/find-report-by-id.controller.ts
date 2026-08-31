import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportParamsSchema } from '../../../../application/dtos/reports/find-report-by-id/input.js';
import {
  ReportDetailOutput,
  ReportMapper,
} from '../../../../application/mappers/reports/report-mapper.js';
import { FindReportByIdUseCase } from '../../../../application/use-cases/reports/find-report-by-id/find-report-by-id.usecase.js';

export class FindReportByIdController {
  constructor(private readonly useCase: FindReportByIdUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportDetailOutput>> {
    const { actor } = request.context;
    const { reportId } = reportParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.ReportView).includes('ESCOLA') ? null : actor.id;

    const report = await this.useCase.execute(reportId, actor.id, viewerId);

    return { statusCode: 200, body: ReportMapper.detailToOutput(report) };
  }
}
