import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindStatusResult } from '../../../../application/dtos/status/find-status/output.js';
import { FindStatusUseCase } from '../../../../application/use-cases/status/find-status/find-status.usecase.js';

export class FindStatusController implements IController<IHttpRequest, FindStatusResult> {
  constructor(private readonly useCase: FindStatusUseCase) {}

  async handle(): Promise<IHttpResponse<FindStatusResult>> {
    const body = await this.useCase.execute();

    return { statusCode: body.status === 'ok' ? 200 : 503, body };
  }
}
