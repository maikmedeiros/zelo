import { z } from 'zod';

export const findPostagemByIdParamsSchema = z.object({ postagemId: z.uuid() });

export type FindPostagemByIdInputDTO = z.infer<typeof findPostagemByIdParamsSchema>;
