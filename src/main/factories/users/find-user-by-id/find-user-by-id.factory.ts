import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindUserByIdUseCase } from '@modules/application/use-cases/users/find-user-by-id/find-user-by-id.usecase.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { FindUserByIdController } from '@modules/presentation/controllers/users/find-user-by-id/find-user-by-id.controller.js';

export const makeFindUserByIdController = (): FindUserByIdController =>
  new FindUserByIdController(new FindUserByIdUseCase(new UserRepository(db.core)), authz.scopesOf);
