import { z } from 'zod';

export const revokeTeacherLinkSchema = z.object({
  linkId: z.guid(),
});

export type RevokeTeacherLinkInput = z.infer<typeof revokeTeacherLinkSchema>;
