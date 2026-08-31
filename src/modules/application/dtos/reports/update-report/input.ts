import { z } from 'zod';
import { REPORT_DIMENSIONS, REPORT_LEVELS } from '../../../../domain/entities/report.js';

const itemSchema = z
  .strictObject({
    dimension: z.enum(REPORT_DIMENSIONS),
    level: z.enum(REPORT_LEVELS).optional(),
    note: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((item) => item.level !== undefined || item.note !== undefined, {
    message: 'Informe level, note ou os dois',
  });

export const updateReportSchema = z
  .strictObject({
    periodStart: z.iso.date().optional(),
    periodEnd: z.iso.date().optional(),
    synthesis: z.string().trim().max(5000).nullable().optional(),
    items: z
      .array(itemSchema)
      .max(REPORT_DIMENSIONS.length)
      .refine((items) => new Set(items.map((item) => item.dimension)).size === items.length, {
        message: 'Dimensão repetida',
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' })
  .refine(
    (data) =>
      data.periodStart === undefined ||
      data.periodEnd === undefined ||
      data.periodEnd >= data.periodStart,
    { message: 'periodEnd não pode ser anterior a periodStart', path: ['periodEnd'] },
  );

export type UpdateReportInput = z.infer<typeof updateReportSchema>;
