import { z } from 'zod';

// A pessoa precisa existir e ter CPF — ver `assertPersonHasCpf`. Aqui só o que é do papel.
export const createGuardianSchema = z.strictObject({
  personId: z.guid(),
  receiveEmail: z.boolean().default(true),
  receivePush: z.boolean().default(true),
});

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
