import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  mediaItemParamsSchema,
  postMediaParamsSchema,
} from '../../../../application/dtos/posts/media/find-media-by-id/input.js';

/** Rotas sobre a coleção: `/posts/:postId/media`. Não há corpo JSON — a imagem é multipart. */
export const postMediaValidator: RequestHandler = (req, _res, next) => {
  const params = postMediaParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};

/** Rotas sobre um item: `/posts/:postId/media/:mediaId`. */
export const mediaItemValidator: RequestHandler = (req, _res, next) => {
  const params = mediaItemParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};
