import { db } from '@config/database.js';
import { RevokeEnrollmentUseCase } from '@modules/application/use-cases/enrollments/revoke-enrollment/revoke-enrollment.usecase.js';
import { EnrollmentRepository } from '@modules/infra/repositories/enrollment.repository.js';
import { RevokeEnrollmentController } from '@modules/presentation/controllers/enrollments/revoke-enrollment/revoke-enrollment.controller.js';

export const makeRevokeEnrollmentController = (): RevokeEnrollmentController =>
  new RevokeEnrollmentController(new RevokeEnrollmentUseCase(new EnrollmentRepository(db.core)));
