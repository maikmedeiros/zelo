import { z } from 'zod';

export const journalParamsSchema = z.object({
  studentId: z.guid(),
});

export const journalEntryParamsSchema = z.object({
  studentId: z.guid(),
  entryId: z.guid(),
});

export const findListJournalEntriesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  date: z.iso.date().optional(),
});
