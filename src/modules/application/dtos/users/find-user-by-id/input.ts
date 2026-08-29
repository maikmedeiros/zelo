import { z } from 'zod';

export const findUserByIdSchema = z.object({
  userId: z.guid(),
});

export type FindUserByIdInput = z.infer<typeof findUserByIdSchema>;
