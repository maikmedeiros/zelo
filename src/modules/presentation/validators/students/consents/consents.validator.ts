import { RequestHandler } from 'express';
import { ValidationError } from '@shared/errors/index.js';
import { createConsentSchema } from '../../../../application/dtos/students/consents/create-consent/input.js';
import {
  consentItemParamsSchema,
  consentParamsSchema,
  findListConsentsSchema,
} from '../../../../application/dtos/students/consents/find-list-consents/input.js';

export const findListConsentsValidator: RequestHandler = (req, _res, next) => {
  const params = consentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  // `req.query` é getter sem setter no Express 5: valida sem reatribuir, e o controller
  // re-parseia com o mesmo schema.
  const query = findListConsentsSchema.safeParse(req.query);
  if (!query.success) throw new ValidationError({ cause: query.error.issues });

  next();
};

export const createConsentValidator: RequestHandler = (req, _res, next) => {
  const params = consentParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  const body = createConsentSchema.safeParse(req.body);
  if (!body.success) throw new ValidationError({ cause: body.error.issues });

  req.body = body.data;
  next();
};

export const revokeConsentValidator: RequestHandler = (req, _res, next) => {
  const params = consentItemParamsSchema.safeParse(req.params);
  if (!params.success) throw new ValidationError({ cause: params.error.issues });

  next();
};
