import { z } from 'zod';

export const createJournalEntrySchema = z.strictObject({
  text: z.string().trim().min(1).max(4000),
  referenceDate: z.iso.date().optional(),
  repliesToId: z.guid().optional(),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
