import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindClassByIdUseCase } from '@modules/application/use-cases/classes/find-class-by-id/find-class-by-id.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { FindClassByIdController } from '@modules/presentation/controllers/classes/find-class-by-id/find-class-by-id.controller.js';

export const makeFindClassByIdController = (): FindClassByIdController =>
  new FindClassByIdController(
    new FindClassByIdUseCase(new ClassRepository(db.core)),
    authz.scopesOf,
  );
