import { z } from 'zod';

export const updateGuardianParamsSchema = z.object({
  guardianId: z.guid(),
});

// Nome, CPF e contato são da PESSOA e mudam por `PATCH /people/:personId`. Aqui ficam só as
// preferências de notificação, que são do papel.
export const updateGuardianSchema = z
  .strictObject({
    receiveEmail: z.boolean().optional(),
    receivePush: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;
