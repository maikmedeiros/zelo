import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListTeacherLinksSchema } from '../../../application/dtos/teacher-links/find-list-teacher-links/input.js';

export const findListTeacherLinksValidator: RequestHandler = (req, _res, next) => {
  const result = findListTeacherLinksSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
