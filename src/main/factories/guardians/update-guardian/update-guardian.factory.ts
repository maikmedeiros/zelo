import { db } from '@config/database.js';
import { UpdateGuardianUseCase } from '@modules/application/use-cases/guardians/update-guardian/update-guardian.usecase.js';
import { GuardianRepository } from '@modules/infra/repositories/guardian.repository.js';
import { UpdateGuardianController } from '@modules/presentation/controllers/guardians/update-guardian/update-guardian.controller.js';

export const makeUpdateGuardianController = (): UpdateGuardianController =>
  new UpdateGuardianController(new UpdateGuardianUseCase(new GuardianRepository(db.core)));
