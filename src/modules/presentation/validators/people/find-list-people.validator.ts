import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { findListPeopleSchema } from '../../../application/dtos/people/find-list-people/input.js';

export const findListPeopleValidator: RequestHandler = (req, _res, next) => {
  const result = findListPeopleSchema.safeParse(req.query);
  if (!result.success) throw new ValidationError({ cause: result.error.issues });

  next();
};
