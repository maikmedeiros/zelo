import { ErrorRequestHandler } from 'express';
import { AppError, InternalServerError, ValidationError } from './app-error.js';

export interface ErrorLogger {
  error(obj: Record<string, unknown>, message: string): void;
}

export interface CreateErrorHandlerParams {
  log: ErrorLogger;
  exposeInternals: boolean;
}

export const createErrorHandler =
  ({ log, exposeInternals }: CreateErrorHandlerParams): ErrorRequestHandler =>
  (error, req, res, _next) => {
    const known = error instanceof AppError ? error : new InternalServerError({ cause: error });

    log.error(
      { err: error, method: req.method, url: req.originalUrl, statusCode: known.statusCode },
      known.message,
    );

    if (res.headersSent) return;

    const exposeCause = exposeInternals || known instanceof ValidationError;

    res.status(known.statusCode).json({
      error: known.name,
      message: known.message,
      ...(exposeCause ? { cause: serializeCause(known.cause) } : {}),
      ...(exposeInternals ? { stack: (error as Error).stack } : {}),
    });
  };

const serializeCause = (cause: unknown): unknown => {
  if (cause === undefined || cause === null) return undefined;
  if (cause instanceof Error) return { name: cause.name, message: cause.message };
  return cause;
};
