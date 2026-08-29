import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { revokeEnrollmentSchema } from '../../../application/dtos/enrollments/revoke-enrollment/input.js';

export const revokeEnrollmentValidator: RequestHandler = (req, _res, next) => {
  const result = revokeEnrollmentSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
