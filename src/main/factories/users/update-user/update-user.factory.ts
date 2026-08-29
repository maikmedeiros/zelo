import { db } from '@config/database.js';
import { UpdateUserUseCase } from '@modules/application/use-cases/users/update-user/update-user.usecase.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { UpdateUserController } from '@modules/presentation/controllers/users/update-user/update-user.controller.js';

export const makeUpdateUserController = (): UpdateUserController =>
  new UpdateUserController(new UpdateUserUseCase(new UserRepository(db.core), db.core));
