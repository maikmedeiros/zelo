import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateConsentInput } from '../../../../../application/dtos/students/consents/create-consent/input.js';
import { consentParamsSchema } from '../../../../../application/dtos/students/consents/find-list-consents/input.js';
import {
  ConsentMapper,
  ConsentOutput,
} from '../../../../../application/mappers/students/consents/consent-mapper.js';
import { CreateConsentUseCase } from '../../../../../application/use-cases/students/consents/create-consent/create-consent.usecase.js';

export class CreateConsentController {
  constructor(private readonly useCase: CreateConsentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ConsentOutput>> {
    const { actor } = request.context;
    const { studentId } = consentParamsSchema.parse(request.params);
    const input = request.body as CreateConsentInput;

    const viewerId = authz.scopesOf(actor, Feature.ConsentCreate).includes('ESCOLA')
      ? null
      : actor.id;

    const consent = await this.useCase.execute({
      studentId,
      type: input.type,
      granted: input.granted,
      origin: input.origin,
      guardianId: input.guardianId ?? null,
      documentKey: input.documentKey ?? null,
      note: input.note ?? null,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 201, body: ConsentMapper.toOutput(consent) };
  }
}
