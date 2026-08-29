import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createTeacherSchema } from '../../../application/dtos/teachers/create-teacher/input.js';

export const createTeacherValidator: RequestHandler = (req, _res, next) => {
  const result = createTeacherSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
