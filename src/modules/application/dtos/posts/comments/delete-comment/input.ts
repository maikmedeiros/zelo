import { z } from 'zod';

/**
 * O corpo do DELETE é opcional, e o `reason` só é exigido quando quem remove **não** é o
 * autor: a escola precisa registrar por que retirou a fala de uma família, e o autor
 * apagando o próprio comentário não deve satisfação a ninguém. Quem cobra é o use-case, que
 * sabe quem está removendo — o schema não tem essa informação.
 */
export const deleteCommentSchema = z.strictObject({
  reason: z.string().trim().min(3).max(500).optional(),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
