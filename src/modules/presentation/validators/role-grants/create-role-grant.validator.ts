import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createRoleGrantSchema } from '../../../application/dtos/role-grants/create-role-grant/input.js';

export const createRoleGrantValidator: RequestHandler = (req, _res, next) => {
  const result = createRoleGrantSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
