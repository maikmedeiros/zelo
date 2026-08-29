import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListClassAccessesSchema } from '../../../application/dtos/class-accesses/find-list-class-accesses/input.js';

export const findListClassAccessesValidator: RequestHandler = (req, _res, next) => {
  const result = findListClassAccessesSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
