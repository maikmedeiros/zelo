import { z } from 'zod';

/**
 * BODY de escrita → z.strictObject. NÃO é gosto: o default do Zod (`strip`) DESCARTA chave
 * desconhecida em silêncio, então um typo (`alunoId` em vez de `alunoIds`) sumiria sem
 * erro, o campo cairia no `.default([])` e a marcação de alunos ficaria silenciosamente
 * incompleta. `strictObject` transforma isso em 400 `unrecognized_keys`.
 */
export const createPostagemSchema = z.strictObject({
  turmaId: z.uuid(),
  titulo: z.string().trim().min(1).max(120),
  texto: z.string().trim().min(1).max(5000),
  alunoIds: z.array(z.uuid()).max(60).default([]),
});

export type CreatePostagemInputDTO = z.infer<typeof createPostagemSchema>;
