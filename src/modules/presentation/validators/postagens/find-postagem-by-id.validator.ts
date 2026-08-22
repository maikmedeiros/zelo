import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findPostagemByIdParamsSchema } from '@modules/application/dtos/postagens/find-postagem-by-id/input.js';

export function findPostagemByIdValidator(req: Request, _res: Response, next: NextFunction): void {
  const result = findPostagemByIdParamsSchema.safeParse(req.params);

  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
}
