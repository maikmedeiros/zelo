import { db } from '@config/database.js';
import { FindListConsentsUseCase } from '@modules/application/use-cases/students/consents/find-list-consents/find-list-consents.usecase.js';
import { ConsentRepository } from '@modules/infra/repositories/consent.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { FindListConsentsController } from '@modules/presentation/controllers/students/consents/find-list-consents/find-list-consents.controller.js';

export const makeFindListConsentsController = (): FindListConsentsController =>
  new FindListConsentsController(
    new FindListConsentsUseCase(new StudentRepository(db.core), new ConsentRepository(db.core)),
  );
