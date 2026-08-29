import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListPeopleUseCase } from '@modules/application/use-cases/people/find-list-people/find-list-people.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { FindListPeopleController } from '@modules/presentation/controllers/people/find-list-people/find-list-people.controller.js';

export const makeFindListPeopleController = (): FindListPeopleController =>
  new FindListPeopleController(
    new FindListPeopleUseCase(new PersonRepository(db.core)),
    authz.scopesOf,
  );
