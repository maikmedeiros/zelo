import { z } from 'zod';

export const classConsentParamsSchema = z.object({
  classId: z.guid(),
});

export const findListClassConsentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
