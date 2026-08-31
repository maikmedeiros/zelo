import { z } from 'zod';
import { REPORT_DIMENSIONS, REPORT_LEVELS } from '../../../../domain/entities/report.js';

export const templateItemSchema = z
  .strictObject({
    dimension: z.enum(REPORT_DIMENSIONS),
    level: z.enum(REPORT_LEVELS).nullable().optional(),
    note: z.string().trim().min(1).max(2000).nullable().optional(),
  })
  .refine((item) => (item.level ?? null) !== null || (item.note ?? null) !== null, {
    message: 'O item precisa de level, de note, ou dos dois',
  });

export const uniqueDimensions = <T extends { dimension: string }>(items: T[]): boolean =>
  new Set(items.map((item) => item.dimension)).size === items.length;

export const createReportTemplateSchema = z.strictObject({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(1).max(500).optional(),
  synthesis: z.string().trim().min(1).max(5000).optional(),
  items: z
    .array(templateItemSchema)
    .max(REPORT_DIMENSIONS.length)
    .refine(uniqueDimensions, { message: 'Dimensão repetida' })
    .default([]),
});

export type CreateReportTemplateInput = z.infer<typeof createReportTemplateSchema>;
