import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindCurrentSessionOutput } from '../../../../application/dtos/sessions/find-current-session/output.js';
import { SessionMapper } from '../../../../application/mappers/sessions/session-mapper.js';
import { FindCurrentSessionUseCase } from '../../../../application/use-cases/sessions/find-current-session/find-current-session.usecase.js';

export class FindCurrentSessionController {
  constructor(private readonly useCase: FindCurrentSessionUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindCurrentSessionOutput>> {
    const { actor } = request.context;
    const user = await this.useCase.execute(actor.id);

    return {
      statusCode: 200,
      body: SessionMapper.toCurrentSession(user, actor.features, actor.groups),
    };
  }
}
