import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListGuardianLinksSchema } from '../../../application/dtos/guardian-links/find-list-guardian-links/input.js';

export const findListGuardianLinksValidator: RequestHandler = (req, _res, next) => {
  const result = findListGuardianLinksSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
