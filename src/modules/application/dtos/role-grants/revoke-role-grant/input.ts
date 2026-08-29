import { z } from 'zod';

export const revokeRoleGrantSchema = z.object({
  grantId: z.guid(),
});

export type RevokeRoleGrantInput = z.infer<typeof revokeRoleGrantSchema>;
