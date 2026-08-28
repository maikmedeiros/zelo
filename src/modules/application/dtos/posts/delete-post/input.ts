import { z } from 'zod';

export const deletePostParamsSchema = z.object({
  postId: z.guid(),
});
