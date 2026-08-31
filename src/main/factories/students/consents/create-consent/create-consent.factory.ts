import { db } from '@config/database.js';
import { CreateConsentUseCase } from '@modules/application/use-cases/students/consents/create-consent/create-consent.usecase.js';
import { ConsentRepository } from '@modules/infra/repositories/consent.repository.js';
import { GuardianLinkRepository } from '@modules/infra/repositories/guardian-link.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { CreateConsentController } from '@modules/presentation/controllers/students/consents/create-consent/create-consent.controller.js';

export const makeCreateConsentController = (): CreateConsentController =>
  new CreateConsentController(
    new CreateConsentUseCase(
      new StudentRepository(db.core),
      new GuardianLinkRepository(db.core),
      new ConsentRepository(db.core),
    ),
  );
