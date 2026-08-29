import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createGuardianLinkSchema } from '../../../application/dtos/guardian-links/create-guardian-link/input.js';

export const createGuardianLinkValidator: RequestHandler = (req, _res, next) => {
  const result = createGuardianLinkSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
