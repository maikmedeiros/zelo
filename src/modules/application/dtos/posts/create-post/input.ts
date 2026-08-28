import { z } from 'zod';
import { POST_AUDIENCES, POST_TYPES } from '../../../../domain/entities/post.js';

// A postagem nasce RASCUNHO — publicar é rota própria (`PUBLISH:POST`), não um campo do
// corpo. Por isso não existe `status` aqui.
export const createPostSchema = z
  .strictObject({
    audience: z.enum(POST_AUDIENCES),
    classIds: z.array(z.guid()).default([]),
    studentIds: z.array(z.guid()).default([]),
    type: z.enum(POST_TYPES).default('REGISTRO_DIARIO'),
    title: z.string().trim().min(1).max(200).nullable().default(null),
    body: z.string().trim().min(1).nullable().default(null),
    referenceDate: z.iso.date().optional(),
  })
  .refine((data) => (data.audience === 'TURMA' ? data.classIds.length > 0 : true), {
    message: 'audience TURMA exige ao menos uma turma em classIds',
    path: ['classIds'],
  })
  .refine((data) => (data.audience === 'TURMA' ? data.studentIds.length === 0 : true), {
    message: 'audience TURMA não aceita studentIds',
    path: ['studentIds'],
  })
  .refine((data) => (data.audience === 'ALUNO' ? data.studentIds.length > 0 : true), {
    message: 'audience ALUNO exige ao menos um aluno em studentIds',
    path: ['studentIds'],
  })
  .refine((data) => (data.audience === 'ALUNO' ? data.classIds.length === 0 : true), {
    message: 'audience ALUNO não aceita classIds',
    path: ['classIds'],
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
