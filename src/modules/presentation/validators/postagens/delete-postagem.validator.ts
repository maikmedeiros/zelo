import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deletePostagemParamsSchema } from '@modules/application/dtos/postagens/delete-postagem/input.js';

export function deletePostagemValidator(req: Request, _res: Response, next: NextFunction): void {
  const result = deletePostagemParamsSchema.safeParse(req.params);

  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
}
