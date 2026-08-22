import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createPostagemSchema } from '@modules/application/dtos/postagens/create-postagem/input.js';

/**
 * A rota é `multipart/form-data` (o `multer` já rodou), então `alunoIds` chega como string.
 * Normaliza ANTES do `strictObject`, que rejeitaria o tipo errado.
 */
const parseAlunoIds = (raw: unknown): unknown => {
  if (raw === undefined || raw === '') return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return raw;

  const trimmed = raw.trim();
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Deixa passar como está: quem produz a mensagem de erro é o Zod, não este helper.
      return raw;
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export function createPostagemValidator(req: Request, _res: Response, next: NextFunction): void {
  const body = req.body as Record<string, unknown>;
  const result = createPostagemSchema.safeParse({
    ...body,
    ...(body.alunoIds === undefined ? {} : { alunoIds: parseAlunoIds(body.alunoIds) }),
  });

  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data; // BODY: reatribui o dado coergido/defaultado.
  next();
}
