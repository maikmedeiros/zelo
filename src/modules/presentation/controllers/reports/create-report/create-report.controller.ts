import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateReportInput } from '../../../../application/dtos/reports/create-report/input.js';
import {
  ReportDetailOutput,
  ReportMapper,
} from '../../../../application/mappers/reports/report-mapper.js';
import { CreateReportUseCase } from '../../../../application/use-cases/reports/create-report/create-report.usecase.js';

export class CreateReportController {
  constructor(private readonly useCase: CreateReportUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReportDetailOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateReportInput;

    const viewerId = authz.scopesOf(actor, Feature.ReportCreate).includes('ESCOLA')
      ? null
      : actor.id;

    const report = await this.useCase.execute({
      studentId: input.studentId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      synthesis: input.synthesis ?? null,
      templateId: input.templateId ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 201, body: ReportMapper.detailToOutput(report) };
  }
}
