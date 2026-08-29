import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createUserSchema } from '../../../application/dtos/users/create-user/input.js';

export const createUserValidator: RequestHandler = (req, _res, next) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
