import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListRoleGrantsSchema } from '../../../application/dtos/role-grants/find-list-role-grants/input.js';

export const findListRoleGrantsValidator: RequestHandler = (req, _res, next) => {
  const result = findListRoleGrantsSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
