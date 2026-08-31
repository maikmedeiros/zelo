import { ForbiddenError, NotFoundError } from '@shared/errors/index.js';
import { Consent, ConsentOrigin, ConsentType } from '../../../../../domain/entities/consent.js';
import { IConsentRepository } from '../../../../../domain/repositories/i-consent-repository.js';
import { IGuardianLinkRepository } from '../../../../../domain/repositories/i-guardian-link-repository.js';
import { IStudentRepository } from '../../../../../domain/repositories/i-student-repository.js';
import { assertActorMayConsent, resolveConsentGuardian } from '../consent-authority.js';

export interface CreateConsentInput {
  studentId: string;
  type: ConsentType;
  granted: boolean;
  origin: ConsentOrigin;
  guardianId: string | null;
  documentKey: string | null;
  note: string | null;
  actorId: string;
  viewerId: string | null;
}

export class CreateConsentUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly linkRepo: IGuardianLinkRepository,
    private readonly consentRepo: IConsentRepository,
  ) {}

  async execute(input: CreateConsentInput): Promise<Consent> {
    const student = await this.studentRepo.findById(input.studentId, input.actorId, input.viewerId);

    if (!student) {
      throw new NotFoundError({ message: 'Aluno não encontrado' });
    }

    const authority = await assertActorMayConsent(this.linkRepo, input.studentId, input.actorId);

    if (!authority && input.origin === 'PORTAL_RESPONSAVEL') {
      throw new ForbiddenError({
        message: 'A origem PORTAL_RESPONSAVEL é do próprio responsável',
      });
    }

    const guardianId = await resolveConsentGuardian(
      this.linkRepo,
      input.studentId,
      authority,
      input.guardianId,
    );

    return this.consentRepo.create({
      studentId: input.studentId,
      type: input.type,
      granted: input.granted,
      origin: input.origin,
      recordedBy: input.actorId,
      guardianId,
      documentKey: input.documentKey,
      note: input.note,
    });
  }
}
