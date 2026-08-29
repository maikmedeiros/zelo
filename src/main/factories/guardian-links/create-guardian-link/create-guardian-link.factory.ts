import { db } from '@config/database.js';
import { CreateGuardianLinkUseCase } from '@modules/application/use-cases/guardian-links/create-guardian-link/create-guardian-link.usecase.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { GuardianRepository } from '@modules/infra/repositories/guardian.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { CreateGuardianLinkController } from '@modules/presentation/controllers/guardian-links/create-guardian-link/create-guardian-link.controller.js';

export const makeCreateGuardianLinkController = (): CreateGuardianLinkController =>
  new CreateGuardianLinkController(
    new CreateGuardianLinkUseCase(
      new GuardianLinkRepository(db.core),
      new GuardianRepository(db.core),
      new StudentRepository(db.core),
    ),
  );
