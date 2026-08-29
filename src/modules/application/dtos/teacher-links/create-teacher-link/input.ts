import { z } from 'zod';
import { TEACHER_ROLES } from '../../../../domain/entities/teacher-link.js';

export const createTeacherLinkSchema = z.strictObject({
  teacherId: z.guid(),
  classId: z.guid(),
  role: z.enum(TEACHER_ROLES).default('TITULAR'),
  startDate: z.iso.date().optional(),
});

export type CreateTeacherLinkInput = z.infer<typeof createTeacherLinkSchema>;
