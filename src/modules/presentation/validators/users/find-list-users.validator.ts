import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListUsersSchema } from '../../../application/dtos/users/find-list-users/input.js';

export const findListUsersValidator: RequestHandler = (req, _res, next) => {
  const result = findListUsersSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
