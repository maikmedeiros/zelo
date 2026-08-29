import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateUserParamsSchema,
  updateUserSchema,
} from '../../../application/dtos/users/update-user/input.js';

export const updateUserValidator: RequestHandler = (req, _res, next) => {
  const params = updateUserParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateUserSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
