import { z } from 'zod';

export const reactionParamsSchema = z.object({
  postId: z.guid(),
});
