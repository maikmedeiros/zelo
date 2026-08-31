import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createReportTemplateSchema } from '../../../application/dtos/report-templates/create-report-template/input.js';
import { findListReportTemplatesSchema } from '../../../application/dtos/report-templates/find-list-report-templates/input.js';
import { reportTemplateParamsSchema } from '../../../application/dtos/report-templates/find-report-template-by-id/input.js';
import { updateReportTemplateSchema } from '../../../application/dtos/report-templates/update-report-template/input.js';

export const findListReportTemplatesValidator: RequestHandler = (req, _res, next) => {
  const query = findListReportTemplatesSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};

export const reportTemplateParamsValidator: RequestHandler = (req, _res, next) => {
  const params = reportTemplateParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};

export const createReportTemplateValidator: RequestHandler = (req, _res, next) => {
  const body = createReportTemplateSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};

export const updateReportTemplateValidator: RequestHandler = (req, _res, next) => {
  const params = reportTemplateParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateReportTemplateSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
