import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findStudentByIdSchema } from '../../../application/dtos/students/find-student-by-id/input.js';

export const findStudentByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findStudentByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
