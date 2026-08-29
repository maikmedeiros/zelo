import { z } from 'zod';

export const revokeEnrollmentSchema = z.object({
  enrollmentId: z.guid(),
});

export type RevokeEnrollmentInput = z.infer<typeof revokeEnrollmentSchema>;
