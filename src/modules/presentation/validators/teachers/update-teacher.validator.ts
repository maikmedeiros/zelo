import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateTeacherParamsSchema,
  updateTeacherSchema,
} from '../../../application/dtos/teachers/update-teacher/input.js';

export const updateTeacherValidator: RequestHandler = (req, _res, next) => {
  const params = updateTeacherParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateTeacherSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
