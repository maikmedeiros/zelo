import { z } from 'zod';

export const revokeClassAccessSchema = z.object({
  accessId: z.guid(),
});

export type RevokeClassAccessInput = z.infer<typeof revokeClassAccessSchema>;
