import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindPersonByIdUseCase } from '@modules/application/use-cases/people/find-person-by-id/find-person-by-id.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { FindPersonByIdController } from '@modules/presentation/controllers/people/find-person-by-id/find-person-by-id.controller.js';

export const makeFindPersonByIdController = (): FindPersonByIdController =>
  new FindPersonByIdController(
    new FindPersonByIdUseCase(new PersonRepository(db.core)),
    authz.scopesOf,
  );
