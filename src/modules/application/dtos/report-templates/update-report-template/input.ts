import { z } from 'zod';
import { REPORT_DIMENSIONS } from '../../../../domain/entities/report.js';
import { templateItemSchema, uniqueDimensions } from '../create-report-template/input.js';

export const updateReportTemplateSchema = z
  .strictObject({
    name: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(1).max(500).nullable().optional(),
    synthesis: z.string().trim().min(1).max(5000).nullable().optional(),
    items: z
      .array(templateItemSchema)
      .max(REPORT_DIMENSIONS.length)
      .refine(uniqueDimensions, { message: 'Dimensão repetida' })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Corpo vazio: nada a alterar' });

export type UpdateReportTemplateInput = z.infer<typeof updateReportTemplateSchema>;
