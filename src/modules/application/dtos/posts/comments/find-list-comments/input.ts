import { z } from 'zod';

export const commentParamsSchema = z.object({
  postId: z.guid(),
});

export const commentItemParamsSchema = z.object({
  postId: z.guid(),
  commentId: z.guid(),
});

// Query é lenienete (`z.object`): a query string acumula lixo incidental que não deve virar
// 400. Ver src/modules/presentation/validators/CLAUDE.md.
export const findListCommentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
