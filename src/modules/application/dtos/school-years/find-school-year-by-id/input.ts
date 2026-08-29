import { z } from 'zod';

export const findSchoolYearByIdSchema = z.object({
  schoolYearId: z.guid(),
});

export type FindSchoolYearByIdInput = z.infer<typeof findSchoolYearByIdSchema>;
