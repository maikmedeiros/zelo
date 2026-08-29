import { z } from 'zod';

export const deleteSchoolYearSchema = z.object({
  schoolYearId: z.guid(),
});

export type DeleteSchoolYearInput = z.infer<typeof deleteSchoolYearSchema>;
