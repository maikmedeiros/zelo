import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportParamsSchema } from '../../../../application/dtos/reports/find-report-by-id/input.js';
import {
  ReportDetailOutput,
  ReportMapper,
} from '../../../../application/mappers/reports/report-mapper.js';
import { PublishReportUseCase } from '../../../../application/use-cases/reports/publish-report/publish-report.usecase.js';
import { makeReportGuard } from '../report-guard.js';

export class PublishReportController {
  constructor(private readonly useCase: PublishReportUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportDetailOutput>> {
    const { actor } = request.context;
    const { reportId } = reportParamsSchema.parse(request.params);

    const report = await this.useCase.execute(
      reportId,
      actor.id,
      makeReportGuard(authz.can, actor, Feature.ReportPublish),
    );

    return { statusCode: 200, body: ReportMapper.detailToOutput(report) };
  }
}
