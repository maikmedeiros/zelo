import { z } from 'zod';

export const findListSchoolYearsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type FindListSchoolYearsInput = z.infer<typeof findListSchoolYearsSchema>;
