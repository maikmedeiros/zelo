import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateClassParamsSchema,
  updateClassSchema,
} from '../../../application/dtos/classes/update-class/input.js';

export const updateClassValidator: RequestHandler = (req, _res, next) => {
  const params = updateClassParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateClassSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
