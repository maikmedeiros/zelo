import express, { Express } from 'express';
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

  // TODO(authz): `injectActor` era global aqui — toda rota nascia privada. Saiu junto com o
  // ActorRepository, que consultava o esquema v1. Ao reconstruir o ator sobre o modelo v2,
  // esta linha volta ANTES do setupRoutes, senão as rotas novas nascem públicas.
  await setupRoutes(app);

  app.use(createGlobalErrorHandler(env.isProduction));

  return app;
};
