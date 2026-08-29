import { z } from 'zod';

// `grantedBy` não vem no corpo: sai do ator, como toda autoria do projeto.
export const createRoleGrantSchema = z.strictObject({
  userId: z.guid(),
  roleId: z.guid(),
  startDate: z.iso.date().optional(),
});

export type CreateRoleGrantInput = z.infer<typeof createRoleGrantSchema>;
