import { z } from 'zod';
import { CONSENT_ORIGINS, CONSENT_TYPES } from '../../../../../domain/entities/consent.js';

export const createConsentSchema = z
  .strictObject({
    type: z.enum(CONSENT_TYPES),
    granted: z.boolean(),
    origin: z.enum(CONSENT_ORIGINS),
    guardianId: z.guid().optional(),
    documentKey: z.string().trim().min(1).max(500).optional(),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .refine((data) => data.origin !== 'SOLICITACAO_VERBAL' || data.documentKey !== undefined, {
    message: 'Consentimento verbal exige o documento que o comprova',
    path: ['documentKey'],
  });

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
