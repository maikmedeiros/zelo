import { db } from '@config/database.js';
import { DeleteUserUseCase } from '@modules/application/use-cases/users/delete-user/delete-user.usecase.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { DeleteUserController } from '@modules/presentation/controllers/users/delete-user/delete-user.controller.js';

export const makeDeleteUserController = (): DeleteUserController =>
  new DeleteUserController(new DeleteUserUseCase(new UserRepository(db.core), db.core));
