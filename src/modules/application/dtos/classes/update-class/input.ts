import { z } from 'zod';
import { CLASS_SHIFTS } from '../../../../domain/entities/class.js';

export const updateClassParamsSchema = z.object({
  classId: z.guid(),
});

// `schoolYearId` não é alterável: mover uma turma de ano letivo levaria matrículas,
// vínculos e postagens junto, sem que nada disso tenha sido pedido. Turma nova é o caminho.
export const updateClassSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(100).optional(),
    segment: z.string().trim().min(1).max(100).optional(),
    shift: z.enum(CLASS_SHIFTS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateClassInput = z.infer<typeof updateClassSchema>;
