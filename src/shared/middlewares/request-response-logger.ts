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

/**
 * Log de request/response no MongoDB. Três invariantes que NÃO devem ser quebradas:
 *
 * 1. Nunca no caminho da resposta — a escrita acontece em `res.on('finish')`, depois de a
 *    resposta ir ao cliente, e o `insertOne` NÃO é aguardado.
 * 2. Mongo fora não vira erro de request — `getCollection()` devolve `null` e o middleware
 *    desiste em silêncio.
 * 3. Nada de dado sensível — `redact` por nome de chave, `pickHeaders` por allowlist
 *    (`authorization` e `cookie` nunca são gravados) e `truncate` no corpo.
 *
 * PRÉ-REQUISITO DE DEPLOY: nenhum índice é criado pelo código. Antes de ligar em produção,
 * crie o índice TTL — `db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: N })` —
 * porque a aplicação nunca remove documento e a coleção cresce indefinidamente.
 */
export const createRequestResponseLogger = ({
  mongo,
  collection,
  maxBodySizeBytes,
}: RequestResponseLoggerOptions): RequestHandler => {
  return (req, res, next) => {
    if (isExcludedPath(req.originalUrl)) return next();

    const startedAt = process.hrtime.bigint();

    // Capturado no INÍCIO, antes de o validator reatribuir `req.body`: o que interessa
    // auditar é o que o cliente enviou, não o dado coergido.
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

      // O ator é lido AQUI: no `finish` o `injectActor` já resolveu (ou já falhou com 401,
      // e o log do 401 sem ator também interessa).
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

      // Fire-and-forget: só `.catch()` que loga. Aguardar aqui atrasaria o socket.
      collectionRef.insertOne(document).catch((err) => {
        logger.warn({ err }, 'Falha ao gravar o log de requisição no MongoDB');
      });
    });

    next();
  };
};

/**
 * Envelopa `res.json`/`res.send` para capturar o corpo. O Express chama `send` por dentro
 * do `json`, então o `send` só grava se o `json` ainda não gravou.
 */
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
