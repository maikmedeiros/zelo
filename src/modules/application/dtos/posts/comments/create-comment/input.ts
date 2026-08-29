import { z } from 'zod';

// `strictObject`: chave desconhecida vira 400 em vez de sumir em silêncio.
export const createCommentSchema = z.strictObject({
  body: z.string().trim().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
