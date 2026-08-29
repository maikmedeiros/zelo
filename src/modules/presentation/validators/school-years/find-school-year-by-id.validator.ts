import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findSchoolYearByIdSchema } from '../../../application/dtos/school-years/find-school-year-by-id/input.js';

export const findSchoolYearByIdValidator: RequestHandler = (req, _res, next) => {
  const result = findSchoolYearByIdSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
