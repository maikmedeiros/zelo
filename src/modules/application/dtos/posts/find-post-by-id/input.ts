import { z } from 'zod';

export const findPostByIdSchema = z.object({
  postId: z.guid(),
});

export type FindPostByIdInput = z.infer<typeof findPostByIdSchema>;
