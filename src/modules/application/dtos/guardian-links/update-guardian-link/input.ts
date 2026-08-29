import { z } from 'zod';
import { RELATIONSHIPS } from '../../../../domain/entities/guardian-link.js';

export const updateGuardianLinkParamsSchema = z.object({
  linkId: z.guid(),
});

// Trocar responsável ou aluno não é alterar o vínculo: é outro vínculo. Encerra-se este e
// cria-se aquele, e o histórico continua contando a verdade.
export const updateGuardianLinkSchema = z
  .strictObject({
    relationship: z.enum(RELATIONSHIPS).optional(),
    canConsent: z.boolean().optional(),
    financial: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateGuardianLinkInput = z.infer<typeof updateGuardianLinkSchema>;
