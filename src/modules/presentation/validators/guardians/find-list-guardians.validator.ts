import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListGuardiansSchema } from '../../../application/dtos/guardians/find-list-guardians/input.js';

export const findListGuardiansValidator: RequestHandler = (req, _res, next) => {
  const result = findListGuardiansSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
