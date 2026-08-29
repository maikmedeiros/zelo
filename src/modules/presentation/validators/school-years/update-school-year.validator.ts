import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  updateSchoolYearParamsSchema,
  updateSchoolYearSchema,
} from '../../../application/dtos/school-years/update-school-year/input.js';

export const updateSchoolYearValidator: RequestHandler = (req, _res, next) => {
  const params = updateSchoolYearParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = updateSchoolYearSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};
