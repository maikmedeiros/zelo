import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createRoleSchema } from '../../../application/dtos/roles/create-role/input.js';

export const createRoleValidator: RequestHandler = (req, _res, next) => {
  const result = createRoleSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
