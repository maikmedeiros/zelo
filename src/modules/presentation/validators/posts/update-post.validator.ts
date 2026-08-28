import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updatePostParamsSchema,
  updatePostSchema,
} from '../../../application/dtos/posts/update-post/input.js';

export const updatePostValidator: RequestHandler = (req, _res, next) => {
  const params = updatePostParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updatePostSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
