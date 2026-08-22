import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListPostagensQuerySchema } from '@modules/application/dtos/postagens/find-list-postagens/input.js';

export function findListPostagensValidator(req: Request, _res: Response, next: NextFunction): void {
  const result = findListPostagensQuerySchema.safeParse(req.query);

  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
}
