import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportParamsSchema } from '../../../../application/dtos/reports/find-report-by-id/input.js';
import { UpdateReportInput } from '../../../../application/dtos/reports/update-report/input.js';
import {
  ReportDetailOutput,
  ReportMapper,
} from '../../../../application/mappers/reports/report-mapper.js';
import { UpdateReportUseCase } from '../../../../application/use-cases/reports/update-report/update-report.usecase.js';
import { makeReportGuard } from '../report-guard.js';

export class UpdateReportController {
  constructor(private readonly useCase: UpdateReportUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportDetailOutput>> {
    const { actor } = request.context;
    const { reportId } = reportParamsSchema.parse(request.params);
    const input = request.body as UpdateReportInput;

    const report = await this.useCase.execute({
      reportId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      synthesis: input.synthesis,
      items: input.items,
      actorId: actor.id,
      guard: makeReportGuard(authz.can, actor, Feature.ReportUpdate),
    });

    return { statusCode: 200, body: ReportMapper.detailToOutput(report) };
  }
}
