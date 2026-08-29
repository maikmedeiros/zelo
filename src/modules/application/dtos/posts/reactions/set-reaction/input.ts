import { z } from 'zod';

/**
 * O código do catálogo, não um id. Validar a existência aqui exigiria ler `reacao` no
 * schema; quem confere é o SQL do upsert, que já precisa da linha para pegar o `reacao_id`.
 */
export const setReactionSchema = z.strictObject({
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .toUpperCase()
    .regex(/^[A-Z][A-Z_]*$/, 'Use o código do catálogo, ex.: JOINHA'),
});

export type SetReactionInput = z.infer<typeof setReactionSchema>;
