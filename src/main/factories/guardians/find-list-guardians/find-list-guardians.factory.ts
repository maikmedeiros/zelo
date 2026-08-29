import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListGuardiansUseCase } from '@modules/application/use-cases/guardians/find-list-guardians/find-list-guardians.usecase.js';
import { GuardianRepository } from '@modules/infra/repositories/guardian.repository.js';
import { FindListGuardiansController } from '@modules/presentation/controllers/guardians/find-list-guardians/find-list-guardians.controller.js';

export const makeFindListGuardiansController = (): FindListGuardiansController =>
  new FindListGuardiansController(
    new FindListGuardiansUseCase(new GuardianRepository(db.core)),
    authz.scopesOf,
  );
