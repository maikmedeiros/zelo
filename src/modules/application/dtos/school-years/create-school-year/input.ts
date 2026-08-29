import { z } from 'zod';

// A escola não vem no corpo: sai do ator, no SQL. Ver sql/escola-do-ator.ts.
export const createSchoolYearSchema = z
  .strictObject({
    year: z.number().int().min(2000).max(2100),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate precisa ser posterior a startDate',
    path: ['endDate'],
  });

export type CreateSchoolYearInput = z.infer<typeof createSchoolYearSchema>;
