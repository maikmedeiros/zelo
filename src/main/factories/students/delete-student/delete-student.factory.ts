import { db } from '@config/database.js';
import { DeleteStudentUseCase } from '@modules/application/use-cases/students/delete-student/delete-student.usecase.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { DeleteStudentController } from '@modules/presentation/controllers/students/delete-student/delete-student.controller.js';

export const makeDeleteStudentController = (): DeleteStudentController =>
  new DeleteStudentController(new DeleteStudentUseCase(new StudentRepository(db.core)));
