import express, { Express } from 'express';
import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { metrics } from '@config/metrics.js';
import { setupPrivateRoutes, setupPublicRoutes } from '@config/routes.js';
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

  await setupPublicRoutes(app);

  app.use(authz.injectActor);

  await setupPrivateRoutes(app);

  app.use(createGlobalErrorHandler(env.isProduction));

  return app;
};
