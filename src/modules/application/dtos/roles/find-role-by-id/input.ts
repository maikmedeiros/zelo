import { z } from 'zod';

export const findRoleByIdSchema = z.object({
  roleId: z.guid(),
});

export type FindRoleByIdInput = z.infer<typeof findRoleByIdSchema>;
