import { SessionCookie } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateSessionInput } from '../../../../application/dtos/sessions/create-session/input.js';
import { CreateSessionOutput } from '../../../../application/dtos/sessions/create-session/output.js';
import { SessionMapper } from '../../../../application/mappers/sessions/session-mapper.js';
import { CreateSessionUseCase } from '../../../../application/use-cases/sessions/create-session/create-session.usecase.js';
import { FindCurrentSessionUseCase } from '../../../../application/use-cases/sessions/find-current-session/find-current-session.usecase.js';

export class CreateSessionController {
  constructor(
    private readonly useCase: CreateSessionUseCase,
    private readonly findCurrent: FindCurrentSessionUseCase,
    private readonly sessionCookie: SessionCookie,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateSessionOutput>> {
    const opened = await this.useCase.execute(request.body as CreateSessionInput, {
      ip: request.ip ?? null,
      userAgent: request.header('user-agent') ?? null,
    });

    this.sessionCookie.set(request.res!, opened.token);

    const user = await this.findCurrent.execute(opened.userId);

    return { statusCode: 201, body: SessionMapper.toIdentity(user) };
  }
}
