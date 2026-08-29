import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListEnrollmentsUseCase } from '@modules/application/use-cases/enrollments/find-list-enrollments/find-list-enrollments.usecase.js';
import { EnrollmentRepository } from '@modules/infra/repositories/enrollment.repository.js';
import { FindListEnrollmentsController } from '@modules/presentation/controllers/enrollments/find-list-enrollments/find-list-enrollments.controller.js';

export const makeFindListEnrollmentsController = (): FindListEnrollmentsController =>
  new FindListEnrollmentsController(
    new FindListEnrollmentsUseCase(new EnrollmentRepository(db.core)),
    authz.scopesOf,
  );
