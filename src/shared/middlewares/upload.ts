import { RequestHandler } from 'express';
import multer from 'multer';
import { PayloadTooLargeError, ValidationError } from '@shared/errors/index.js';

export interface UploadOptions {
  maxFileSizeBytes: number;
}

export const createUpload = ({ maxFileSizeBytes }: UploadOptions): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSizeBytes },
  });

/**
 * O `upload.single()` do multer, com os erros dele traduzidos.
 *
 * O multer não lança: ele entrega um `MulterError` ao `next`, e o handler global — que só
 * conhece `AppError` — embrulharia tudo em 500. Arquivo grande demais e campo com nome errado
 * são erro **do cliente**, e responder 500 a eles esconderia o defeito do lado errado.
 *
 * A tradução mora aqui porque é aqui que o multer é conhecido: o handler global não deve
 * aprender sobre biblioteca de upload.
 */
export const singleFile = (field: string, options: UploadOptions): RequestHandler => {
  const handler = createUpload(options).single(field);

  return (req, res, next) => {
    handler(req, res, (error: unknown) => {
      if (!(error instanceof multer.MulterError)) return next(error);

      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          new PayloadTooLargeError({
            message: 'Arquivo maior que o limite permitido',
            cause: { limiteBytes: options.maxFileSizeBytes },
          }),
        );
      }

      next(
        new ValidationError({
          cause: [
            { path: [error.field ?? field], message: `Envie um único arquivo em \`${field}\`` },
          ],
        }),
      );
    });
  };
};
