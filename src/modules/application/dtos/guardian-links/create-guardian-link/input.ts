import { z } from 'zod';
import { RELATIONSHIPS } from '../../../../domain/entities/guardian-link.js';

// `canConfirm` nasce **false**: assinar consentimento de LGPD por uma criança não é
// consequência automática de ser responsável por ela. Quem pode é decisão explícita.
export const createGuardianLinkSchema = z.strictObject({
  guardianId: z.guid(),
  studentId: z.guid(),
  relationship: z.enum(RELATIONSHIPS),
  canConsent: z.boolean().default(false),
  financial: z.boolean().default(false),
  startDate: z.iso.date().optional(),
});

export type CreateGuardianLinkInput = z.infer<typeof createGuardianLinkSchema>;
