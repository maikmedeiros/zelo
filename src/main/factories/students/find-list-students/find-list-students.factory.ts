import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListStudentsUseCase } from '@modules/application/use-cases/students/find-list-students/find-list-students.usecase.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { FindListStudentsController } from '@modules/presentation/controllers/students/find-list-students/find-list-students.controller.js';

export const makeFindListStudentsController = (): FindListStudentsController =>
  new FindListStudentsController(
    new FindListStudentsUseCase(new StudentRepository(db.core)),
    authz.scopesOf,
  );
