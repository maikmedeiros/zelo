import { z } from 'zod';

export const publishPostParamsSchema = z.object({
  postId: z.guid(),
});
