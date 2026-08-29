import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateGuardianLinkInput } from '../../../../application/dtos/guardian-links/create-guardian-link/input.js';
import { CreateGuardianLinkOutput } from '../../../../application/dtos/guardian-links/create-guardian-link/output.js';
import { GuardianLinkMapper } from '../../../../application/mappers/guardian-links/guardian-link-mapper.js';
import { CreateGuardianLinkUseCase } from '../../../../application/use-cases/guardian-links/create-guardian-link/create-guardian-link.usecase.js';

export class CreateGuardianLinkController {
  constructor(private readonly useCase: CreateGuardianLinkUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateGuardianLinkOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateGuardianLinkInput;

    const link = await this.useCase.execute({
      guardianId: input.guardianId,
      studentId: input.studentId,
      relationship: input.relationship,
      canConsent: input.canConsent,
      financial: input.financial,
      startDate: input.startDate ?? null,
      actorId: actor.id,
    });

    return { statusCode: 201, body: GuardianLinkMapper.toOutput(link) };
  }
}
