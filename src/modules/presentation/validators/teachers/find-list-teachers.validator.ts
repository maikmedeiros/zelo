import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListTeachersSchema } from '../../../application/dtos/teachers/find-list-teachers/input.js';

export const findListTeachersValidator: RequestHandler = (req, _res, next) => {
  const result = findListTeachersSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
