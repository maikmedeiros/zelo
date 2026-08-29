import { db } from '@config/database.js';
import { UpdateStudentUseCase } from '@modules/application/use-cases/students/update-student/update-student.usecase.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { UpdateStudentController } from '@modules/presentation/controllers/students/update-student/update-student.controller.js';

export const makeUpdateStudentController = (): UpdateStudentController =>
  new UpdateStudentController(new UpdateStudentUseCase(new StudentRepository(db.core)));
