import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createSessionSchema } from '../../../application/dtos/sessions/create-session/input.js';

export const createSessionValidator: RequestHandler = (req, _res, next) => {
  const result = createSessionSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
