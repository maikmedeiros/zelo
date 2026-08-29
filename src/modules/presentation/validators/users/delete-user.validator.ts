import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deleteUserSchema } from '../../../application/dtos/users/delete-user/input.js';

export const deleteUserValidator: RequestHandler = (req, _res, next) => {
  const result = deleteUserSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
