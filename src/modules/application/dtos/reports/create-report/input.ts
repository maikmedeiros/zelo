import { z } from 'zod';

export const createReportSchema = z
  .strictObject({
    studentId: z.guid(),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    synthesis: z.string().trim().min(1).max(5000).optional(),
    templateId: z.guid().optional(),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'periodEnd não pode ser anterior a periodStart',
    path: ['periodEnd'],
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
