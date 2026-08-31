import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import {
  classConsentParamsSchema,
  findListClassConsentsSchema,
} from '../../../../application/dtos/classes/consents/find-list-class-consents/input.js';

export const findListClassConsentsValidator: RequestHandler = (req, _res, next) => {
  const params = classConsentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const query = findListClassConsentsSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};
