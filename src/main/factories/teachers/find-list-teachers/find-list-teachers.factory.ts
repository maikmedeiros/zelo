import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListTeachersUseCase } from '@modules/application/use-cases/teachers/find-list-teachers/find-list-teachers.usecase.js';
import { TeacherRepository } from '@modules/infra/repositories/teacher.repository.js';
import { FindListTeachersController } from '@modules/presentation/controllers/teachers/find-list-teachers/find-list-teachers.controller.js';

export const makeFindListTeachersController = (): FindListTeachersController =>
  new FindListTeachersController(
    new FindListTeachersUseCase(new TeacherRepository(db.core)),
    authz.scopesOf,
  );
