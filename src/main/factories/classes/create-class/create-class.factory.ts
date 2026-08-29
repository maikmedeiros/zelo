import { db } from '@config/database.js';
import { CreateClassUseCase } from '@modules/application/use-cases/classes/create-class/create-class.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { SchoolYearRepository } from '@modules/infra/repositories/school-year.repository.js';
import { CreateClassController } from '@modules/presentation/controllers/classes/create-class/create-class.controller.js';

export const makeCreateClassController = (): CreateClassController =>
  new CreateClassController(
    new CreateClassUseCase(new ClassRepository(db.core), new SchoolYearRepository(db.core)),
  );
