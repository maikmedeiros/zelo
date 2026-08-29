import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { revokeGuardianLinkSchema } from '../../../application/dtos/guardian-links/revoke-guardian-link/input.js';

export const revokeGuardianLinkValidator: RequestHandler = (req, _res, next) => {
  const result = revokeGuardianLinkSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
