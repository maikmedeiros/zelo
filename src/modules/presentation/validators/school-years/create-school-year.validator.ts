import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createSchoolYearSchema } from '../../../application/dtos/school-years/create-school-year/input.js';

export const createSchoolYearValidator: RequestHandler = (req, _res, next) => {
  const result = createSchoolYearSchema.safeParse(req.body);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  req.body = result.data;
  next();
};
