import { z } from 'zod';

export const reportParamsSchema = z.object({
  reportId: z.guid(),
});
