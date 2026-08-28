import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findPostByIdSchema } from '../../../application/dtos/posts/find-post-by-id/input.js';

export const findPostByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findPostByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
