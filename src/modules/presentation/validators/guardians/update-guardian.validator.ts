import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateGuardianParamsSchema,
  updateGuardianSchema,
} from '../../../application/dtos/guardians/update-guardian/input.js';

export const updateGuardianValidator: RequestHandler = (req, _res, next) => {
  const params = updateGuardianParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateGuardianSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
