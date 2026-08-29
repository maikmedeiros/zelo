import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findClassByIdSchema } from '../../../application/dtos/classes/find-class-by-id/input.js';

export const findClassByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findClassByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
