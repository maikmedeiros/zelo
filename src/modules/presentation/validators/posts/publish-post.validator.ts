import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { publishPostParamsSchema } from '../../../application/dtos/posts/publish-post/input.js';

export const publishPostValidator: RequestHandler = (req, _res, next) => {
  const result = publishPostParamsSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
