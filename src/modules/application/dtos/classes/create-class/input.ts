import { z } from 'zod';
import { CLASS_SHIFTS } from '../../../../domain/entities/class.js';

export const createClassSchema = z.strictObject({
  schoolYearId: z.guid(),
  name: z.string().trim().min(1).max(100),
  segment: z.string().trim().min(1).max(100),
  shift: z.enum(CLASS_SHIFTS),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
