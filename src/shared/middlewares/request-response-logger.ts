import { RequestHandler, Response } from 'express';
import { MongoDatabase } from '@shared/infra/database/index.js';
import { RequestWithContext } from '@shared/auth/index.js';
import { logger } from '@shared/utils/logger/index.js';
import { isExcludedPath, pickHeaders, redact, truncate } from '@shared/utils/request-log/index.js';

export interface RequestResponseLoggerOptions {
  mongo: MongoDatabase;
  collection: string;
  maxBodySizeBytes: number;
}

interface RequestLogDocument {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  actor: { id: string; handle: string; kind: string } | null;
  request: { headers: Record<string, unknown>; query: unknown; params: unknown; body: unknown };
  response: { body: unknown };
}

export const createRequestResponseLogger = ({
  mongo,
  collection,
  maxBodySizeBytes,
}: RequestResponseLoggerOptions): RequestHandler => {
  return (req, res, next) => {
    if (isExcludedPath(req.originalUrl)) return next();

    const startedAt = process.hrtime.bigint();

    const request = {
      headers: pickHeaders(req.headers),
      query: redact(req.query),
      params: redact(req.params),
      body: truncate(redact(req.body), maxBodySizeBytes),
    };

    const captured = captureResponseBody(res);

    res.on('finish', () => {
      const collectionRef = mongo.getCollection<RequestLogDocument>(collection);
      if (!collectionRef) return;

      const actor = (req as unknown as Partial<RequestWithContext>).context?.actor ?? null;

      const document: RequestLogDocument = {
        timestamp: new Date(),
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        actor: actor ? { id: actor.id, handle: actor.handle, kind: actor.kind } : null,
        request,
        response: { body: truncate(redact(captured.body), maxBodySizeBytes) },
      };

      collectionRef.insertOne(document).catch((err) => {
        logger.warn({ err }, 'Falha ao gravar o log de requisição no MongoDB');
      });
    });

    next();
  };
};

const captureResponseBody = (res: Response): { body: unknown } => {
  const captured: { body: unknown } = { body: undefined };
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body: unknown) => {
    captured.body = body;
    return originalJson(body);
  };

  res.send = (body: unknown) => {
    if (captured.body === undefined) {
      captured.body = Buffer.isBuffer(body) ? `[Buffer ${body.byteLength}B]` : body;
    }
    return originalSend(body);
  };

  return captured;
};
