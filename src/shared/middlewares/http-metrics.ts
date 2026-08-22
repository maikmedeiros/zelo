import { RequestHandler } from 'express';
import { PromMetricsRegistry } from '@shared/infra/metrics/index.js';

export const createHttpMetrics = (metrics: PromMetricsRegistry): RequestHandler => {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      metrics.observeHttpRequest({
        method: req.method,
        // `req.route?.path` só existe depois do match; `originalUrl` explodiria a
        // cardinalidade do label com cada id de recurso.
        route: req.route?.path ?? req.baseUrl ?? 'unmatched',
        statusCode: res.statusCode,
        durationSeconds: Number(process.hrtime.bigint() - startedAt) / 1_000_000_000,
      });
    });

    next();
  };
};

export const createMetricsHandler = (metrics: PromMetricsRegistry): RequestHandler => {
  return async (_req, res) => {
    res.setHeader('Content-Type', metrics.contentType);
    res.send(await metrics.metrics());
  };
};
