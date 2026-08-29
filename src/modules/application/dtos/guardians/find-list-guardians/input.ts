import { z } from 'zod';

export const findListGuardiansSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: z.guid().optional(),
  search: z.string().trim().min(2).max(200).optional(),
});

export type FindListGuardiansInput = z.infer<typeof findListGuardiansSchema>;
