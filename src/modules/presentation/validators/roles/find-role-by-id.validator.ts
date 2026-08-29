import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findRoleByIdSchema } from '../../../application/dtos/roles/find-role-by-id/input.js';

export const findRoleByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findRoleByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
