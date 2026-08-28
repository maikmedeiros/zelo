import { db } from '@config/database.js';
import { FindCurrentSessionUseCase } from '@modules/application/use-cases/sessions/find-current-session/find-current-session.usecase.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { FindCurrentSessionController } from '@modules/presentation/controllers/sessions/find-current-session/find-current-session.controller.js';

export const makeFindCurrentSessionController = (): FindCurrentSessionController =>
  new FindCurrentSessionController(new FindCurrentSessionUseCase(new UserRepository(db.core)));
