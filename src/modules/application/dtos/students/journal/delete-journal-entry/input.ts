import { z } from 'zod';

export const deleteJournalEntrySchema = z.strictObject({
  reason: z.string().trim().min(1).max(500).optional(),
});

export type DeleteJournalEntryInput = z.infer<typeof deleteJournalEntrySchema>;
