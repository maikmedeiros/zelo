import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindGuardianByIdUseCase } from '@modules/application/use-cases/guardians/find-guardian-by-id/find-guardian-by-id.usecase.js';
import { GuardianRepository } from '@modules/infra/repositories/guardian.repository.js';
import { FindGuardianByIdController } from '@modules/presentation/controllers/guardians/find-guardian-by-id/find-guardian-by-id.controller.js';

export const makeFindGuardianByIdController = (): FindGuardianByIdController =>
  new FindGuardianByIdController(
    new FindGuardianByIdUseCase(new GuardianRepository(db.core)),
    authz.scopesOf,
  );
