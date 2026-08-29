import { db } from '@config/database.js';
import { UpdateClassUseCase } from '@modules/application/use-cases/classes/update-class/update-class.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { UpdateClassController } from '@modules/presentation/controllers/classes/update-class/update-class.controller.js';

export const makeUpdateClassController = (): UpdateClassController =>
  new UpdateClassController(new UpdateClassUseCase(new ClassRepository(db.core)));
