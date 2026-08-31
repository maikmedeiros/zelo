import { db } from '@config/database.js';
import { RevokeConsentUseCase } from '@modules/application/use-cases/students/consents/revoke-consent/revoke-consent.usecase.js';
import { ConsentRepository } from '@modules/infra/repositories/consent.repository.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { RevokeConsentController } from '@modules/presentation/controllers/students/consents/revoke-consent/revoke-consent.controller.js';

export const makeRevokeConsentController = (): RevokeConsentController =>
  new RevokeConsentController(
    new RevokeConsentUseCase(new GuardianLinkRepository(db.core), new ConsentRepository(db.core)),
  );
