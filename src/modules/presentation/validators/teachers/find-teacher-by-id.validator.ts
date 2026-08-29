import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findTeacherByIdSchema } from '../../../application/dtos/teachers/find-teacher-by-id/input.js';

export const findTeacherByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findTeacherByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
