import corsMiddleware from 'cors';
import { RequestHandler } from 'express';

export interface CorsOptions {
  allowedOrigins: string[];
}

export const createCors = ({ allowedOrigins }: CorsOptions): RequestHandler =>
  corsMiddleware({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
  });
