import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createClassSchema } from '../../../application/dtos/classes/create-class/input.js';

export const createClassValidator: RequestHandler = (req, _res, next) => {
  const result = createClassSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
