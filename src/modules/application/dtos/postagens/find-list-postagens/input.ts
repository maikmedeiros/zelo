import { z } from 'zod';
import { blankAsUndefined, toCsvList } from '../../shared/query-helpers.js';

// QUERY → z.object (LENIENTE de propósito: a query string acumula lixo incidental,
// `utm_*`, cache-buster, e nada disso deve virar 400).
export const findListPostagensQuerySchema = z.object({
  page: z.preprocess(blankAsUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(blankAsUndefined, z.coerce.number().int().min(1).max(100).default(10)),
  turmaIds: z.preprocess(toCsvList, z.array(z.uuid()).optional()),
  alunoId: z.preprocess(blankAsUndefined, z.uuid().optional()),
  publicadaDe: z.preprocess(blankAsUndefined, z.iso.datetime({ offset: true }).optional()),
  publicadaAte: z.preprocess(blankAsUndefined, z.iso.datetime({ offset: true }).optional()),
});

export type FindListPostagensInputDTO = z.infer<typeof findListPostagensQuerySchema>;
