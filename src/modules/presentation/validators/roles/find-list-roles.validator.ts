import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListRolesSchema } from '../../../application/dtos/roles/find-list-roles/input.js';

export const findListRolesValidator: RequestHandler = (req, _res, next) => {
  const result = findListRolesSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
