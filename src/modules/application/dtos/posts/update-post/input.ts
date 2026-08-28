import { z } from 'zod';
import { POST_AUDIENCES, POST_TYPES } from '../../../../domain/entities/post.js';

export const updatePostParamsSchema = z.object({
  postId: z.guid(),
});

// Todos opcionais: o PATCH altera só o que vier. A troca de audiência é aceita apenas
// enquanto a postagem é RASCUNHO — quem barra é o use-case, que conhece o estado.
export const updatePostSchema = z
  .strictObject({
    audience: z.enum(POST_AUDIENCES).optional(),
    classIds: z.array(z.guid()).optional(),
    studentIds: z.array(z.guid()).optional(),
    type: z.enum(POST_TYPES).optional(),
    title: z.string().trim().min(1).max(200).nullable().optional(),
    body: z.string().trim().min(1).nullable().optional(),
    referenceDate: z.iso.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' })
  .refine(
    (data) => (data.classIds ?? data.studentIds) === undefined || data.audience !== undefined,
    {
      message: 'Trocar a audiência exige informar `audience` junto',
      path: ['audience'],
    },
  );

export type UpdatePostInput = z.infer<typeof updatePostSchema>;
