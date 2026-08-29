import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeGuardianLinkInput } from '../../../../application/dtos/guardian-links/revoke-guardian-link/input.js';
import { RevokeGuardianLinkUseCase } from '../../../../application/use-cases/guardian-links/revoke-guardian-link/revoke-guardian-link.usecase.js';

export class RevokeGuardianLinkController {
  constructor(private readonly useCase: RevokeGuardianLinkUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { linkId } = request.params as unknown as RevokeGuardianLinkInput;

    await this.useCase.execute(linkId, actor.id);

    return { statusCode: 204 };
  }
}
