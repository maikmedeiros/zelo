import { RequestHandler } from 'express';

export const contentType: RequestHandler = (_req, res, next) => {
  res.type('json');
  next();
};
