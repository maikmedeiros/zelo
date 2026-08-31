import { db } from '@config/database.js';
import { FindListClassConsentsUseCase } from '@modules/application/use-cases/classes/consents/find-list-class-consents/find-list-class-consents.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { ConsentRepository } from '@modules/infra/repositories/consent.repository.js';
import { FindListClassConsentsController } from '@modules/presentation/controllers/classes/consents/find-list-class-consents/find-list-class-consents.controller.js';

export const makeFindListClassConsentsController = (): FindListClassConsentsController =>
  new FindListClassConsentsController(
    new FindListClassConsentsUseCase(new ClassRepository(db.core), new ConsentRepository(db.core)),
  );
