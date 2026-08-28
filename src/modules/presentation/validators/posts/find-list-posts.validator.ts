import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListPostsSchema } from '../../../application/dtos/posts/find-list-posts/input.js';

export const findListPostsValidator: RequestHandler = (req, _res, next) => {
  const result = findListPostsSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
