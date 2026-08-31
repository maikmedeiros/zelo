import { z } from 'zod';

export const updateJournalEntrySchema = z.strictObject({
  text: z.string().trim().min(1).max(4000),
});

export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
