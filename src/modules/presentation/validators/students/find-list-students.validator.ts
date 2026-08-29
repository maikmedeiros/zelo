import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListStudentsSchema } from '../../../application/dtos/students/find-list-students/input.js';

export const findListStudentsValidator: RequestHandler = (req, _res, next) => {
  const result = findListStudentsSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
