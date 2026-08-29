import { db } from '@config/database.js';
import { CreateEnrollmentUseCase } from '@modules/application/use-cases/enrollments/create-enrollment/create-enrollment.usecase.js';
import { ClassRepository } from '@modules/infra/repositories/class.repository.js';
import { EnrollmentRepository } from '@modules/infra/repositories/enrollment.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { CreateEnrollmentController } from '@modules/presentation/controllers/enrollments/create-enrollment/create-enrollment.controller.js';

export const makeCreateEnrollmentController = (): CreateEnrollmentController =>
  new CreateEnrollmentController(
    new CreateEnrollmentUseCase(
      new EnrollmentRepository(db.core),
      new StudentRepository(db.core),
      new ClassRepository(db.core),
    ),
  );
