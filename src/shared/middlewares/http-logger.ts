import { RequestHandler } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '@shared/utils/logger/index.js';
import { isExcludedPath } from '@shared/utils/request-log/index.js';

/**
 * Log de acesso no stdout: método, rota, status e duração. NADA de headers ou corpo —
 * o `x-api-key` e o cookie chegam por header e o stdout não passa pela allowlist.
 *
 * Ignora `/metrics` e os paths excluídos: sem isso o scrape a cada 15s afoga o log.
 */
export const httpLogger: RequestHandler = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => isExcludedPath(req.url ?? '') },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} ${err.message}`,
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
});
