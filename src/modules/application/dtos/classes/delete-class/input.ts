import { z } from 'zod';

export const deleteClassSchema = z.object({
  classId: z.guid(),
});

export type DeleteClassInput = z.infer<typeof deleteClassSchema>;
