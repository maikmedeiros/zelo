import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { personPhotoParamsSchema } from '../../../../application/dtos/people/photo/find-photo/input.js';

/**
 * As três rotas da foto validam a mesma coisa: o `personId` da URL. Não há corpo JSON — a
 * imagem chega como `multipart/form-data` e quem a interpreta é o multer, antes daqui.
 */
export const personPhotoValidator: RequestHandler = (req, _res, next) => {
  const params = personPhotoParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};
