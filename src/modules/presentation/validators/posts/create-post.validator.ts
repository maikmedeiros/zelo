import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createPostSchema } from '../../../application/dtos/posts/create-post/input.js';

export const createPostValidator: RequestHandler = (req, _res, next) => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
