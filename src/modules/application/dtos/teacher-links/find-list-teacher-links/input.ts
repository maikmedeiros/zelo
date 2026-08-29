import { z } from 'zod';

export const findListTeacherLinksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  teacherId: z.guid().optional(),
  classId: z.guid().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type FindListTeacherLinksInput = z.infer<typeof findListTeacherLinksSchema>;
