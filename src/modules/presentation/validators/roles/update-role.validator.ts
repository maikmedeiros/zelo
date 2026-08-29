import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateRoleParamsSchema,
  updateRoleSchema,
} from '../../../application/dtos/roles/update-role/input.js';

export const updateRoleValidator: RequestHandler = (req, _res, next) => {
  const params = updateRoleParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateRoleSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
