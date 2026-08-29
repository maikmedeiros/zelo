import { z } from 'zod';

export const updateTeacherParamsSchema = z.object({
  teacherId: z.guid(),
});

export const updateTeacherSchema = z
  .strictObject({
    registration: z.string().trim().min(1).max(30).nullable().optional(),
    education: z.string().trim().min(1).max(2000).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
