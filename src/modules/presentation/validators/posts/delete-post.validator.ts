import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deletePostParamsSchema } from '../../../application/dtos/posts/delete-post/input.js';

export const deletePostValidator: RequestHandler = (req, _res, next) => {
  const result = deletePostParamsSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
