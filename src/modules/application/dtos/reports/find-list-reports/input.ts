import { z } from 'zod';
import { REPORT_STATUSES } from '../../../../domain/entities/report.js';

export const findListReportsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  studentId: z.guid().optional(),
  classId: z.guid().optional(),
  status: z.enum(REPORT_STATUSES).optional(),
});
