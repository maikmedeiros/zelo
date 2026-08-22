import { z } from 'zod';

export const deletePostagemParamsSchema = z.object({ postagemId: z.uuid() });

export type DeletePostagemInputDTO = z.infer<typeof deletePostagemParamsSchema>;
