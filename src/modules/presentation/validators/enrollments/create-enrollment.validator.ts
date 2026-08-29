import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createEnrollmentSchema } from '../../../application/dtos/enrollments/create-enrollment/input.js';

export const createEnrollmentValidator: RequestHandler = (req, _res, next) => {
  const result = createEnrollmentSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
