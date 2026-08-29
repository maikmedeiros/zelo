import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deleteStudentSchema } from '../../../application/dtos/students/delete-student/input.js';

export const deleteStudentValidator: RequestHandler = (req, _res, next) => {
  const result = deleteStudentSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
