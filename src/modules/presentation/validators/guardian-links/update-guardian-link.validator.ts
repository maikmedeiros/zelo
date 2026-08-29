import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateGuardianLinkParamsSchema,
  updateGuardianLinkSchema,
} from '../../../application/dtos/guardian-links/update-guardian-link/input.js';

export const updateGuardianLinkValidator: RequestHandler = (req, _res, next) => {
  const params = updateGuardianLinkParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateGuardianLinkSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
