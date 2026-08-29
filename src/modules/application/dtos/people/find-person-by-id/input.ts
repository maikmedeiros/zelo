import { z } from 'zod';

export const findPersonByIdSchema = z.object({
  personId: z.guid(),
});

export type FindPersonByIdInput = z.infer<typeof findPersonByIdSchema>;
