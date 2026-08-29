import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findPersonByIdSchema } from '../../../application/dtos/people/find-person-by-id/input.js';

export const findPersonByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findPersonByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
