import { db } from '@config/database.js';
import { CreateClassAccessUseCase } from '@modules/application/use-cases/class-accesses/create-class-access/create-class-access.usecase.js';
import { ClassAccessRepository } from '@modules/infra/repositories/class-access.repository.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { CreateClassAccessController } from '@modules/presentation/controllers/class-accesses/create-class-access/create-class-access.controller.js';

export const makeCreateClassAccessController = (): CreateClassAccessController =>
  new CreateClassAccessController(
    new CreateClassAccessUseCase(
      new ClassAccessRepository(db.core),
      new UserRepository(db.core),
      new ClassRepository(db.core),
    ),
  );
