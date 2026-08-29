import { db } from '@config/database.js';
import { RevokeGuardianLinkUseCase } from '@modules/application/use-cases/guardian-links/revoke-guardian-link/revoke-guardian-link.usecase.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { RevokeGuardianLinkController } from '@modules/presentation/controllers/guardian-links/revoke-guardian-link/revoke-guardian-link.controller.js';

export const makeRevokeGuardianLinkController = (): RevokeGuardianLinkController =>
  new RevokeGuardianLinkController(
    new RevokeGuardianLinkUseCase(new GuardianLinkRepository(db.core)),
  );
