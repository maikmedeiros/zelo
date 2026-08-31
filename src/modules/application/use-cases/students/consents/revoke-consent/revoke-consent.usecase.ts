import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IConsentRepository } from '../../../../../domain/repositories/i-consent-repository.js';
import { IGuardianLinkRepository } from '../../../../../domain/repositories/i-guardian-link-repository.js';
import { assertActorMayConsent } from '../consent-authority.js';

export interface RevokeConsentInput {
  studentId: string;
  consentId: string;
  actorId: string;
  viewerId: string | null;
}

export class RevokeConsentUseCase {
  constructor(
    private readonly linkRepo: IGuardianLinkRepository,
    private readonly consentRepo: IConsentRepository,
  ) {}

  async execute(input: RevokeConsentInput): Promise<void> {
    const consent = await this.consentRepo.findById(
      input.consentId,
      input.studentId,
      input.actorId,
      input.viewerId,
    );

    if (!consent) throw new NotFoundError({ message: 'Consentimento não encontrado' });
    await assertActorMayConsent(this.linkRepo, input.studentId, input.actorId);

    const encerrado = await this.consentRepo.revoke(input.consentId, input.studentId);

    if (!encerrado) {
      throw new ConflictError({
        message: 'Consentimento já encerrado',
        cause: { endedAt: consent.endedAt },
      });
    }
  }
}
