import { z } from 'zod';
import { CLASS_SHIFTS } from '../../../../domain/entities/class.js';

export const findListClassesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  schoolYearId: z.guid().optional(),
  shift: z.enum(CLASS_SHIFTS).optional(),
});

export type FindListClassesInput = z.infer<typeof findListClassesSchema>;
