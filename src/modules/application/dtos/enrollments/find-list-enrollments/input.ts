import { z } from 'zod';

export const findListEnrollmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: z.guid().optional(),
  classId: z.guid().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type FindListEnrollmentsInput = z.infer<typeof findListEnrollmentsSchema>;
