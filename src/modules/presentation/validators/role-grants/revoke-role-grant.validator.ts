import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { revokeRoleGrantSchema } from '../../../application/dtos/role-grants/revoke-role-grant/input.js';

export const revokeRoleGrantValidator: RequestHandler = (req, _res, next) => {
  const result = revokeRoleGrantSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
