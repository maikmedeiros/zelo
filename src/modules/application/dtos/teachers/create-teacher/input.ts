import { z } from 'zod';

// A pessoa precisa existir e ter CPF — ver `assertPersonHasCpf`. Aqui só o que é do papel.
export const createTeacherSchema = z.strictObject({
  personId: z.guid(),
  registration: z.string().trim().min(1).max(30).nullable().default(null),
  education: z.string().trim().min(1).max(2000).nullable().default(null),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
