import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListUsersUseCase } from '@modules/application/use-cases/users/find-list-users/find-list-users.usecase.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { FindListUsersController } from '@modules/presentation/controllers/users/find-list-users/find-list-users.controller.js';

export const makeFindListUsersController = (): FindListUsersController =>
  new FindListUsersController(
    new FindListUsersUseCase(new UserRepository(db.core)),
    authz.scopesOf,
  );
