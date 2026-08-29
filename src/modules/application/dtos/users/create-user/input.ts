import { z } from 'zod';

// A senha vem no corpo: quem define é o cliente, e o servidor só aplica o argon2id. O
// `personId` é obrigatório porque o cadastro é em duas etapas — a pessoa já existe.
export const createUserSchema = z.strictObject({
  personId: z.guid(),
  email: z.email().max(255).toLowerCase(),
  password: z.string().min(8).max(1024),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
