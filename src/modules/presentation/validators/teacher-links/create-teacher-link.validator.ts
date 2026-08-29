import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createTeacherLinkSchema } from '../../../application/dtos/teacher-links/create-teacher-link/input.js';

export const createTeacherLinkValidator: RequestHandler = (req, _res, next) => {
  const result = createTeacherLinkSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
