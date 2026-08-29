import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createCommentSchema } from '../../../../application/dtos/posts/comments/create-comment/input.js';
import { deleteCommentSchema } from '../../../../application/dtos/posts/comments/delete-comment/input.js';
import {
  commentItemParamsSchema,
  commentParamsSchema,
  findListCommentsSchema,
} from '../../../../application/dtos/posts/comments/find-list-comments/input.js';

export const findListCommentsValidator: RequestHandler = (req, _res, next) => {
  const params = commentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  // `req.query` é getter sem setter no Express 5: valida sem reatribuir, e o controller
  // re-parseia com o mesmo schema.
  const query = findListCommentsSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};

export const createCommentValidator: RequestHandler = (req, _res, next) => {
  const params = commentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = createCommentSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};

export const deleteCommentValidator: RequestHandler = (req, _res, next) => {
  const params = commentItemParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  // O corpo é opcional: o autor removendo o próprio comentário não manda nada. `?? {}` cobre
  // o DELETE sem corpo, que chega como `undefined` e não passaria no `strictObject`.
  const body = deleteCommentSchema.safeParse(req.body ?? {});
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
