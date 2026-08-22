import { RequestHandler } from 'express';
import { IController, IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';

type ControllerLike = IController | ((r: IHttpRequest) => Promise<IHttpResponse> | IHttpResponse);

/**
 * Não trata erro: no Express 5, rejeições de handlers async são encaminhadas
 * automaticamente ao error handler global. O controller lança, o adapter deixa borbulhar.
 */
export const controller = (target: ControllerLike): RequestHandler => {
  const handle = typeof target === 'function' ? target : target.handle.bind(target);

  return async (req, res) => {
    const { statusCode, body, headers } = await handle(req as IHttpRequest);

    if (headers) for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    if (Buffer.isBuffer(body)) return void res.status(statusCode).send(body);
    if (body === undefined) return void res.status(statusCode).end();

    res.status(statusCode).json(body);
  };
};
