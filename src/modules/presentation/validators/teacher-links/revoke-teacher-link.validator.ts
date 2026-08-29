import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { revokeTeacherLinkSchema } from '../../../application/dtos/teacher-links/revoke-teacher-link/input.js';

export const revokeTeacherLinkValidator: RequestHandler = (req, _res, next) => {
  const result = revokeTeacherLinkSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
