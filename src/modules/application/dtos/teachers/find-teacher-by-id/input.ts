import { z } from 'zod';

export const findTeacherByIdSchema = z.object({
  teacherId: z.guid(),
});

export type FindTeacherByIdInput = z.infer<typeof findTeacherByIdSchema>;
