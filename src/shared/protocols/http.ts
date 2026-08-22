import { Request } from 'express';
import { RequestWithContext } from '@shared/auth/index.js';

/**
 * Estende o `Request` do Express para herdar query/params/body/file já tipados.
 * `context` é obrigatório (não opcional): `injectActor` roda global e toda rota é
 * privada, então todo controller sempre recebe `context.actor`.
 */
export interface IHttpRequest<
  Params = Request['params'],
  Body = unknown,
  Query = Request['query'],
> extends Request<Params, unknown, Body, Query> {
  context: RequestWithContext['context'];
}

/**
 * Retorno estruturado do controller. O controller só descreve o caso de SUCESSO:
 * status de erro é responsabilidade do error handler global (let it throw).
 */
export interface IHttpResponse<Body = unknown> {
  statusCode: number;
  body?: Body;
  headers?: Record<string, string>;
}
