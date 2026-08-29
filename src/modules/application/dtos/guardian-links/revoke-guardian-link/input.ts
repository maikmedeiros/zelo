import { z } from 'zod';

export const revokeGuardianLinkSchema = z.object({
  linkId: z.guid(),
});

export type RevokeGuardianLinkInput = z.infer<typeof revokeGuardianLinkSchema>;
