import { db } from '@config/database.js';
import { UpdatePersonUseCase } from '@modules/application/use-cases/people/update-person/update-person.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { UpdatePersonController } from '@modules/presentation/controllers/people/update-person/update-person.controller.js';

export const makeUpdatePersonController = (): UpdatePersonController =>
  new UpdatePersonController(new UpdatePersonUseCase(new PersonRepository(db.core)));
