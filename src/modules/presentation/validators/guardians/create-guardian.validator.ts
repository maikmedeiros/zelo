import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createGuardianSchema } from '../../../application/dtos/guardians/create-guardian/input.js';

export const createGuardianValidator: RequestHandler = (req, _res, next) => {
  const result = createGuardianSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
