import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindStatusResult } from '../../../../application/dtos/status/find-status/output.js';
import { FindStatusUseCase } from '../../../../application/use-cases/status/find-status/find-status.usecase.js';

export class FindStatusController implements IController<IHttpRequest, FindStatusResult> {
  constructor(private readonly useCase: FindStatusUseCase) {}

  async handle(): Promise<IHttpResponse<FindStatusResult>> {
    const body = await this.useCase.execute();

    // 503 no degradado: é o que faz o healthcheck do orquestrador tirar a instância do
    // balanceador em vez de mandar tráfego para uma API sem banco.
    return { statusCode: body.status === 'ok' ? 200 : 503, body };
  }
}
