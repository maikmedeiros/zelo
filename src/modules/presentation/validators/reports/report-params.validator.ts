import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { reportParamsSchema } from '../../../application/dtos/reports/find-report-by-id/input.js';

export const reportParamsValidator: RequestHandler = (req, _res, next) => {
  const params = reportParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};
