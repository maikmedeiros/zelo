import { z } from 'zod';

export const findStudentByIdSchema = z.object({
  studentId: z.guid(),
});

export type FindStudentByIdInput = z.infer<typeof findStudentByIdSchema>;
