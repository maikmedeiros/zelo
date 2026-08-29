import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findUserByIdSchema } from '../../../application/dtos/users/find-user-by-id/input.js';

export const findUserByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findUserByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
