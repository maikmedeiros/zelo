import { Request } from 'express';
import { RequestWithContext } from '@shared/auth/index.js';

export interface IHttpRequest<
  Params = Request['params'],
  Body = unknown,
  Query = Request['query'],
> extends Request<Params, unknown, Body, Query> {
  context: RequestWithContext['context'];
}

export interface IHttpResponse<Body = unknown> {
  statusCode: number;
  body?: Body;
  headers?: Record<string, string>;
}
