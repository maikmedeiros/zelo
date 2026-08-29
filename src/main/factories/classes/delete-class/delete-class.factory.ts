import { db } from '@config/database.js';
import { DeleteClassUseCase } from '@modules/application/use-cases/classes/delete-class/delete-class.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { DeleteClassController } from '@modules/presentation/controllers/classes/delete-class/delete-class.controller.js';

export const makeDeleteClassController = (): DeleteClassController =>
  new DeleteClassController(new DeleteClassUseCase(new ClassRepository(db.core)));
