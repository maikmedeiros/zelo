import { z } from 'zod';

export const findListUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(2).max(255).optional(),
  // `z.coerce.boolean()` aceitaria a string "false" como true; o enum é explícito.
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  profile: z.string().trim().min(1).max(50).toUpperCase().optional(),
});

export type FindListUsersInput = z.infer<typeof findListUsersSchema>;
