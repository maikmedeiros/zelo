import { z } from 'zod';

export const reportTemplateParamsSchema = z.object({
  templateId: z.guid(),
});
