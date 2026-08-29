import { z } from 'zod';
import { ACCESS_REASONS } from '../../../../domain/entities/class-access.js';

// `grantedBy` não vem no corpo: sai do ator. Este acesso é decisão administrativa, e aceitar
// o concedente do cliente seria deixar qualquer um assinar a concessão em nome de outro.
export const createClassAccessSchema = z.strictObject({
  userId: z.guid(),
  classId: z.guid(),
  reason: z.enum(ACCESS_REASONS),
  justification: z.string().trim().min(1).max(2000).nullable().default(null),
  startDate: z.iso.date().optional(),
});

export type CreateClassAccessInput = z.infer<typeof createClassAccessSchema>;
