import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createPersonSchema } from '../../../application/dtos/people/create-person/input.js';

export const createPersonValidator: RequestHandler = (req, _res, next) => {
  const result = createPersonSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
