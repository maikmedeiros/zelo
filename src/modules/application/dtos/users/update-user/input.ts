import { z } from 'zod';

export const updateUserParamsSchema = z.object({
  userId: z.guid(),
});

// `personId` não é alterável: trocar a pessoa por trás de um login transferiria autoria de
// postagem e consentimento para outra pessoa, em silêncio. Login novo é o caminho.
export const updateUserSchema = z
  .strictObject({
    email: z.email().max(255).toLowerCase().optional(),
    password: z.string().min(8).max(1024).optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
