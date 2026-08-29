import { db } from '@config/database.js';
import { UpdateGuardianLinkUseCase } from '@modules/application/use-cases/guardian-links/update-guardian-link/update-guardian-link.usecase.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { UpdateGuardianLinkController } from '@modules/presentation/controllers/guardian-links/update-guardian-link/update-guardian-link.controller.js';

export const makeUpdateGuardianLinkController = (): UpdateGuardianLinkController =>
  new UpdateGuardianLinkController(
    new UpdateGuardianLinkUseCase(new GuardianLinkRepository(db.core)),
  );
