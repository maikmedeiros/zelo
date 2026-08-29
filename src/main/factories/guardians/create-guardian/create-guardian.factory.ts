import { db } from '@config/database.js';
import { CreateGuardianUseCase } from '@modules/application/use-cases/guardians/create-guardian/create-guardian.usecase.js';
import { GuardianRepository } from '@modules/infra/repositories/guardian.repository.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { CreateGuardianController } from '@modules/presentation/controllers/guardians/create-guardian/create-guardian.controller.js';

export const makeCreateGuardianController = (): CreateGuardianController =>
  new CreateGuardianController(
    new CreateGuardianUseCase(new GuardianRepository(db.core), new PersonRepository(db.core)),
  );
