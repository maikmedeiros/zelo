import { z } from 'zod';

export const updateStudentParamsSchema = z.object({
  studentId: z.guid(),
});

// `personId` não é alterável: trocar a pessoa por trás de um aluno moveria matrícula,
// vínculo de responsável e postagem para outra criança, em silêncio.
export const updateStudentSchema = z
  .strictObject({
    code: z.string().trim().min(1).max(20).nullable().optional(),
    notes: z.string().trim().min(1).max(2000).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
