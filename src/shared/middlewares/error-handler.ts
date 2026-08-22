import { ErrorRequestHandler } from 'express';
import { createErrorHandler } from '@shared/errors/index.js';
import { logger } from '@shared/utils/logger/index.js';

export const createGlobalErrorHandler = (isProduction: boolean): ErrorRequestHandler =>
  createErrorHandler({ log: logger, exposeInternals: !isProduction });
