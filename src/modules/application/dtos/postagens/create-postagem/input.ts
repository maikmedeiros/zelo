import { z } from 'zod';

export const createPostagemSchema = z.strictObject({
  turmaId: z.uuid(),
  titulo: z.string().trim().min(1).max(120),
  texto: z.string().trim().min(1).max(5000),
  alunoIds: z.array(z.uuid()).max(60).default([]),
});

export type CreatePostagemInputDTO = z.infer<typeof createPostagemSchema>;
