import { z } from 'zod';

export const updateSchoolYearParamsSchema = z.object({
  schoolYearId: z.guid(),
});

// Sem `refine` de ordem entre as datas aqui: o PATCH pode mandar só uma delas, e a
// comparação depende do valor que já está no banco. Quem julga é o use-case, depois de ler.
export const updateSchoolYearSchema = z
  .strictObject({
    year: z.number().int().min(2000).max(2100).optional(),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateSchoolYearInput = z.infer<typeof updateSchoolYearSchema>;
