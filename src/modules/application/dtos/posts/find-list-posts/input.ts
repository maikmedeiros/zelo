import { z } from 'zod';
import { POST_TYPES } from '../../../../domain/entities/post.js';

// `REMOVIDA` não é opção: postagem removida some do feed, e ressuscitá-la por query seria
// contornar a remoção lógica.
const STATUS_CONSULTAVEL = ['PUBLICADA', 'RASCUNHO'] as const;

export const findListPostsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  classId: z.guid().optional(),
  studentId: z.guid().optional(),
  authorId: z.guid().optional(),
  status: z.enum(STATUS_CONSULTAVEL).default('PUBLICADA'),
  type: z.enum(POST_TYPES).optional(),
});

export type FindListPostsInput = z.infer<typeof findListPostsSchema>;
