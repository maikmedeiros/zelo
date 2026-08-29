import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindStudentByIdUseCase } from '@modules/application/use-cases/students/find-student-by-id/find-student-by-id.usecase.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { FindStudentByIdController } from '@modules/presentation/controllers/students/find-student-by-id/find-student-by-id.controller.js';

export const makeFindStudentByIdController = (): FindStudentByIdController =>
  new FindStudentByIdController(
    new FindStudentByIdUseCase(new StudentRepository(db.core)),
    authz.scopesOf,
  );
