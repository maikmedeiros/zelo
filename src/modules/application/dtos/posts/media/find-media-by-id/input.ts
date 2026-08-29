import { z } from 'zod';

export const postMediaParamsSchema = z.object({
  postId: z.guid(),
});

export const mediaItemParamsSchema = z.object({
  postId: z.guid(),
  mediaId: z.guid(),
});
