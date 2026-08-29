import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { reactionParamsSchema } from '../../../../application/dtos/posts/reactions/find-reaction-summary/input.js';
import { setReactionSchema } from '../../../../application/dtos/posts/reactions/set-reaction/input.js';

/** Serve ao GET e ao DELETE: as duas só têm o `postId` da URL. */
export const reactionParamsValidator: RequestHandler = (req, _res, next) => {
  const params = reactionParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};

export const setReactionValidator: RequestHandler = (req, _res, next) => {
  const params = reactionParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = setReactionSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
