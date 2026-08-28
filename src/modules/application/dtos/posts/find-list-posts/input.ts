import { z } from 'zod';
import { POST_TYPES } from '../../../../domain/entities/post.js';

export const findListPostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  classId: z.guid().optional(),
  type: z.enum(POST_TYPES).optional(),
});

export type FindListPostsInput = z.infer<typeof findListPostsSchema>;
