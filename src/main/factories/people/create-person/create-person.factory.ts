import { db } from '@config/database.js';
import { CreatePersonUseCase } from '@modules/application/use-cases/people/create-person/create-person.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { CreatePersonController } from '@modules/presentation/controllers/people/create-person/create-person.controller.js';

export const makeCreatePersonController = (): CreatePersonController =>
  new CreatePersonController(new CreatePersonUseCase(new PersonRepository(db.core)));
