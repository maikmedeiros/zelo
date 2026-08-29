import { z } from 'zod';

export const deleteStudentSchema = z.object({
  studentId: z.guid(),
});

export type DeleteStudentInput = z.infer<typeof deleteStudentSchema>;
