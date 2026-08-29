import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updatePersonParamsSchema,
  updatePersonSchema,
} from '../../../application/dtos/people/update-person/input.js';

export const updatePersonValidator: RequestHandler = (req, _res, next) => {
  const params = updatePersonParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updatePersonSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
