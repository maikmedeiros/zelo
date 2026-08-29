import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { deleteSchoolYearSchema } from '../../../application/dtos/school-years/delete-school-year/input.js';

export const deleteSchoolYearValidator: RequestHandler = (req, _res, next) => {
  const result = deleteSchoolYearSchema.safeParse(req.params);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
