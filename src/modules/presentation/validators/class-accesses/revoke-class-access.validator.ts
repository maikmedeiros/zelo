import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { revokeClassAccessSchema } from '../../../application/dtos/class-accesses/revoke-class-access/input.js';

export const revokeClassAccessValidator: RequestHandler = (req, _res, next) => {
  const result = revokeClassAccessSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
