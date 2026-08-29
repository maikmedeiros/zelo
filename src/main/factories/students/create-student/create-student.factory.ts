import { db } from '@config/database.js';
import { CreateStudentUseCase } from '@modules/application/use-cases/students/create-student/create-student.usecase.js';
import { PersonRepository } from '@modules/infra/repositories/person.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { CreateStudentController } from '@modules/presentation/controllers/students/create-student/create-student.controller.js';

export const makeCreateStudentController = (): CreateStudentController =>
  new CreateStudentController(
    new CreateStudentUseCase(new StudentRepository(db.core), new PersonRepository(db.core)),
  );
