import { z } from 'zod';

export const findClassByIdSchema = z.object({
  classId: z.guid(),
});

export type FindClassByIdInput = z.infer<typeof findClassByIdSchema>;
