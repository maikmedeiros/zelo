import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { consentItemParamsSchema } from '../../../../../application/dtos/students/consents/find-list-consents/input.js';
import { RevokeConsentUseCase } from '../../../../../application/use-cases/students/consents/revoke-consent/revoke-consent.usecase.js';

export class RevokeConsentController {
  constructor(private readonly useCase: RevokeConsentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { studentId, consentId } = consentItemParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.ConsentRevoke).includes('ESCOLA')
      ? null
      : actor.id;

    await this.useCase.execute({ studentId, consentId, actorId: actor.id, viewerId });

    return { statusCode: 204 };
  }
}
