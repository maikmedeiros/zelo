import { ForbiddenError, UnprocessableEntityError } from '@shared/errors/index.js';
import {
  ConsentAuthority,
  IGuardianLinkRepository,
} from '../../../../domain/repositories/i-guardian-link-repository.js';

export const assertActorMayConsent = async (
  linkRepo: IGuardianLinkRepository,
  studentId: string,
  actorId: string,
): Promise<ConsentAuthority | null> => {
  const authority = await linkRepo.findConsentAuthority(studentId, actorId);

  if (authority && !authority.canConsent) {
    throw new ForbiddenError({
      message: 'Este vínculo não autoriza consentir pela criança',
    });
  }

  return authority;
};

export const resolveConsentGuardian = async (
  linkRepo: IGuardianLinkRepository,
  studentId: string,
  authority: ConsentAuthority | null,
  guardianId: string | null,
): Promise<string | null> => {
  if (authority) {
    if (guardianId !== null && guardianId !== authority.guardianId) {
      throw new ForbiddenError({
        message: 'Responsável não registra consentimento em nome de outro',
      });
    }

    return authority.guardianId;
  }

  if (guardianId === null) return null;

  const indicado = await linkRepo.findAuthorityOf(studentId, guardianId);

  if (!indicado) {
    throw new UnprocessableEntityError({
      message: 'O responsável indicado não tem vínculo vigente com a criança',
      cause: { campo: 'guardianId' },
    });
  }

  if (!indicado.canConsent) {
    throw new UnprocessableEntityError({
      message: 'O vínculo do responsável indicado não autoriza consentir',
      cause: { campo: 'guardianId' },
    });
  }

  return indicado.guardianId;
};
