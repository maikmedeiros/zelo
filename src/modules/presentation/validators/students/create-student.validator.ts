import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createStudentSchema } from '../../../application/dtos/students/create-student/input.js';

export const createStudentValidator: RequestHandler = (req, _res, next) => {
  const result = createStudentSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
