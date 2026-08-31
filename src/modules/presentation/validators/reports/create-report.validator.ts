import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createReportSchema } from '../../../application/dtos/reports/create-report/input.js';

export const createReportValidator: RequestHandler = (req, _res, next) => {
  const body = createReportSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
