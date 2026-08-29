import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListClassesSchema } from '../../../application/dtos/classes/find-list-classes/input.js';

export const findListClassesValidator: RequestHandler = (req, _res, next) => {
  const result = findListClassesSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
