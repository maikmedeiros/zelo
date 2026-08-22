import { ErrorRequestHandler } from 'express';
import { AppError, InternalServerError, ValidationError } from './app-error.js';

export interface ErrorLogger {
  error(obj: Record<string, unknown>, message: string): void;
}

export interface CreateErrorHandlerParams {
  log: ErrorLogger;
  exposeInternals: boolean;
}

/**
 * Último middleware da cadeia — é o que fecha o "let it throw".
 *
 * Não tem efeito colateral: NÃO mexe em cookie nem em sessão. Um 401 aqui não prova
 * sessão inválida; quem limpa o cookie é o `injectActor`, que sabe por que falhou.
 */
export const createErrorHandler =
  ({ log, exposeInternals }: CreateErrorHandlerParams): ErrorRequestHandler =>
  (error, req, res, _next) => {
    const known = error instanceof AppError ? error : new InternalServerError({ cause: error });

    log.error(
      { err: error, method: req.method, url: req.originalUrl, statusCode: known.statusCode },
      known.message,
    );

    // Resposta já iniciada (stream/arquivo): não há como trocar o status.
    if (res.headersSent) return;

    // Em produção o `cause` só sai para ValidationError: ali ele é o relatório dos erros
    // do próprio cliente (as `issues` do Zod), sem nada interno. Para os demais, `cause`
    // e `stack` ficam apenas no log.
    const exposeCause = exposeInternals || known instanceof ValidationError;

    res.status(known.statusCode).json({
      error: known.name,
      message: known.message,
      ...(exposeCause ? { cause: serializeCause(known.cause) } : {}),
      ...(exposeInternals ? { stack: (error as Error).stack } : {}),
    });
  };

// `issues` do Zod e `Error` aninhado precisam virar JSON; o resto passa direto.
const serializeCause = (cause: unknown): unknown => {
  if (cause === undefined || cause === null) return undefined;
  if (cause instanceof Error) return { name: cause.name, message: cause.message };
  return cause;
};
