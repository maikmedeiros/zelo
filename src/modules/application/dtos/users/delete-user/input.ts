import { z } from 'zod';

export const deleteUserSchema = z.object({
  userId: z.guid(),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
