import { z } from 'zod';
import { CONSENT_TYPES } from '../../../../../domain/entities/consent.js';

export const consentParamsSchema = z.object({
  studentId: z.guid(),
});

export const consentItemParamsSchema = z.object({
  studentId: z.guid(),
  consentId: z.guid(),
});

export const findListConsentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(CONSENT_TYPES).optional(),
  current: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
