import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reportParamsSchema } from '../../../../application/dtos/reports/find-report-by-id/input.js';
import { DeleteReportUseCase } from '../../../../application/use-cases/reports/delete-report/delete-report.usecase.js';
import { makeReportGuard } from '../report-guard.js';

export class DeleteReportController {
  constructor(private readonly useCase: DeleteReportUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { reportId } = reportParamsSchema.parse(request.params);

    await this.useCase.execute(reportId, makeReportGuard(authz.can, actor, Feature.ReportDelete));

    return { statusCode: 204 };
  }
}
