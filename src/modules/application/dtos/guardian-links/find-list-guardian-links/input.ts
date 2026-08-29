import { z } from 'zod';

export const findListGuardianLinksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  guardianId: z.guid().optional(),
  studentId: z.guid().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type FindListGuardianLinksInput = z.infer<typeof findListGuardianLinksSchema>;
