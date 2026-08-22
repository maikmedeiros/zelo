import corsMiddleware from 'cors';
import { RequestHandler } from 'express';

export interface CorsOptions {
  allowedOrigins: string[];
}

/**
 * Allowlist DINÂMICA: só origem da lista recebe `Access-Control-Allow-Origin`, ecoando a
 * origem — nunca `*` junto de credenciais.
 *
 * Request SEM `Origin` (server-to-server, curl) é liberada: não é CORS, e barrar aqui
 * quebraria integração por api key sem motivo.
 */
export const createCors = ({ allowedOrigins }: CorsOptions): RequestHandler =>
  corsMiddleware({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
  });
