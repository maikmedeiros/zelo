import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deleteClassSchema } from '../../../application/dtos/classes/delete-class/input.js';

export const deleteClassValidator: RequestHandler = (req, _res, next) => {
  const result = deleteClassSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
