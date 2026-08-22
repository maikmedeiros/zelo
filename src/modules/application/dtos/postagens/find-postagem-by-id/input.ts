import { z } from 'zod';

// PARAMS → z.object (vêm da própria URL).
export const findPostagemByIdParamsSchema = z.object({ postagemId: z.uuid() });

export type FindPostagemByIdInputDTO = z.infer<typeof findPostagemByIdParamsSchema>;
