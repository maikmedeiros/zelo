import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createClassAccessSchema } from '../../../application/dtos/class-accesses/create-class-access/input.js';

export const createClassAccessValidator: RequestHandler = (req, _res, next) => {
  const result = createClassAccessSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
