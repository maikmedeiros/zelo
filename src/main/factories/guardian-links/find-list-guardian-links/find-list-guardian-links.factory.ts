import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListGuardianLinksUseCase } from '@modules/application/use-cases/guardian-links/find-list-guardian-links/find-list-guardian-links.usecase.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { FindListGuardianLinksController } from '@modules/presentation/controllers/guardian-links/find-list-guardian-links/find-list-guardian-links.controller.js';

export const makeFindListGuardianLinksController = (): FindListGuardianLinksController =>
  new FindListGuardianLinksController(
    new FindListGuardianLinksUseCase(new GuardianLinkRepository(db.core)),
    authz.scopesOf,
  );
