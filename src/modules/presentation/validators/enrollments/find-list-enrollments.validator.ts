import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListEnrollmentsSchema } from '../../../application/dtos/enrollments/find-list-enrollments/input.js';

export const findListEnrollmentsValidator: RequestHandler = (req, _res, next) => {
  const result = findListEnrollmentsSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
