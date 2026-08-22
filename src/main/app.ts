import express, { Express } from 'express';
import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { metrics } from '@config/metrics.js';
import setupRoutes from '@config/routes.js';
import {
  bodyParserJson,
  bodyParserRaw,
  bodyParserUrlencoded,
  contentType,
  createCors,
  createGlobalErrorHandler,
  createHttpMetrics,
  createMetricsHandler,
  createRequestResponseLogger,
  helmet,
  httpLogger,
} from '@shared/middlewares/index.js';

/**
 * A ORDEM DESTES MIDDLEWARES É SIGNIFICATIVA. Cada bloco tem um motivo:
 *
 * - `/metrics` vem ANTES do `injectActor`: o scrape do Prometheus é público.
 * - `requestResponseLogger` vem DEPOIS dos body parsers (precisa de `req.body` populado) e
 *   ANTES do `injectActor`, para que o 401 dele também vire log.
 * - `injectActor` é GLOBAL: toda rota é privada. Rota pública, se houver, entra ANTES dele.
 * - `errorHandler` é SEMPRE o último — é o que fecha o "let it throw".
 */
export const createApp = async (): Promise<Express> => {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet);
  app.use(httpLogger);

  app.get('/metrics', createMetricsHandler(metrics));
  app.use(createHttpMetrics(metrics));

  app.use(bodyParserJson);
  app.use(bodyParserUrlencoded);
  app.use(bodyParserRaw);
  app.use(createCors({ allowedOrigins: env.cors.allowedOrigins }));
  app.use(contentType);

  if (env.mongo.logEnabled) {
    app.use(
      createRequestResponseLogger({
        mongo: db.mongo,
        collection: env.mongo.collection,
        maxBodySizeBytes: env.mongo.maxBodySizeBytes,
      }),
    );
  }

  app.use(authz.injectActor);

  await setupRoutes(app);

  app.use(createGlobalErrorHandler(env.isProduction));

  return app;
};
