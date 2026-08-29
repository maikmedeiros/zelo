import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findGuardianByIdSchema } from '../../../application/dtos/guardians/find-guardian-by-id/input.js';

export const findGuardianByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findGuardianByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
