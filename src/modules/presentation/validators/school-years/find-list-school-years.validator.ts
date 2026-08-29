import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListSchoolYearsSchema } from '../../../application/dtos/school-years/find-list-school-years/input.js';

export const findListSchoolYearsValidator: RequestHandler = (req, _res, next) => {
  const result = findListSchoolYearsSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
