import { z } from 'zod';

export const createSessionSchema = z.strictObject({
  email: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(1024),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
