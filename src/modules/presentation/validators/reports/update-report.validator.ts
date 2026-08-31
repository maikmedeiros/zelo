import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { reportParamsSchema } from '../../../application/dtos/reports/find-report-by-id/input.js';
import { updateReportSchema } from '../../../application/dtos/reports/update-report/input.js';

export const updateReportValidator: RequestHandler = (req, _res, next) => {
  const params = reportParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateReportSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
