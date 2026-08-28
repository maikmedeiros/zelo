import { SessionCookie, hashToken, readCookie } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeSessionUseCase } from '../../../../application/use-cases/sessions/revoke-session/revoke-session.usecase.js';

export class RevokeSessionController {
  constructor(
    private readonly useCase: RevokeSessionUseCase,
    private readonly sessionCookie: SessionCookie,
    private readonly cookieName: string,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const token = readCookie(request, this.cookieName);
    if (token) await this.useCase.execute(hashToken(token));

    this.sessionCookie.clear(request.res!);

    return { statusCode: 204 };
  }
}
