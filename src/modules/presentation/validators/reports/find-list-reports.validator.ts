import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListReportsSchema } from '../../../application/dtos/reports/find-list-reports/input.js';

export const findListReportsValidator: RequestHandler = (req, _res, next) => {
  const query = findListReportsSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};
