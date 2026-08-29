import { z } from 'zod';

// Só o papel: os dados da pessoa já foram gravados em `POST /people`. É o cadastro em duas
// etapas — primeiro quem a pessoa é, depois o que ela é.
export const createStudentSchema = z.strictObject({
  personId: z.guid(),
  code: z.string().trim().min(1).max(20).nullable().default(null),
  notes: z.string().trim().min(1).max(2000).nullable().default(null),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
