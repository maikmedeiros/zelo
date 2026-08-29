import { z } from 'zod';

export const createEnrollmentSchema = z.strictObject({
  studentId: z.guid(),
  classId: z.guid(),
  /** Ausente vira `CURRENT_DATE` no SQL — matricular hoje é o caso comum. */
  startDate: z.iso.date().optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
