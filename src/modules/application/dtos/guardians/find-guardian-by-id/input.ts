import { z } from 'zod';

export const findGuardianByIdSchema = z.object({
  guardianId: z.guid(),
});

export type FindGuardianByIdInput = z.infer<typeof findGuardianByIdSchema>;
