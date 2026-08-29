import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListClassesUseCase } from '@modules/application/use-cases/classes/find-list-classes/find-list-classes.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { FindListClassesController } from '@modules/presentation/controllers/classes/find-list-classes/find-list-classes.controller.js';

export const makeFindListClassesController = (): FindListClassesController =>
  new FindListClassesController(
    new FindListClassesUseCase(new ClassRepository(db.core)),
    authz.scopesOf,
  );
