import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListClassAccessesUseCase } from '@modules/application/use-cases/class-accesses/find-list-class-accesses/find-list-class-accesses.usecase.js';
import { ClassAccessRepository } from '@modules/infra/repositories/class-access.repository.js';
import { FindListClassAccessesController } from '@modules/presentation/controllers/class-accesses/find-list-class-accesses/find-list-class-accesses.controller.js';

export const makeFindListClassAccessesController = (): FindListClassAccessesController =>
  new FindListClassAccessesController(
    new FindListClassAccessesUseCase(new ClassAccessRepository(db.core)),
    authz.scopesOf,
  );
