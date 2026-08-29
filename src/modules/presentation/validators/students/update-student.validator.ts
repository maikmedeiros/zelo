import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateStudentParamsSchema,
  updateStudentSchema,
} from '../../../application/dtos/students/update-student/input.js';

export const updateStudentValidator: RequestHandler = (req, _res, next) => {
  const params = updateStudentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateStudentSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
