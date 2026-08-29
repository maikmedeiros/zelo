import { db } from '@config/database.js';
import { CreateUserUseCase } from '@modules/application/use-cases/users/create-user/create-user.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { CreateUserController } from '@modules/presentation/controllers/users/create-user/create-user.controller.js';

export const makeCreateUserController = (): CreateUserController =>
  new CreateUserController(
    new CreateUserUseCase(new UserRepository(db.core), new PersonRepository(db.core)),
  );
