import { RequestHandler } from 'express';

/** JSON é o default de resposta; quem devolve outra coisa sobrescreve no controller. */
export const contentType: RequestHandler = (_req, res, next) => {
  res.type('json');
  next();
};
