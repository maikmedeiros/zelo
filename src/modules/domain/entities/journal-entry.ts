export const JOURNAL_ENTRY_STATUSES = [
  'PUBLICADA',
  'REMOVIDA_PELO_AUTOR',
  'REMOVIDA_PELA_ESCOLA',
] as const;

export type JournalEntryStatus = (typeof JOURNAL_ENTRY_STATUSES)[number];

export interface JournalEntry {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  authorId: string;
  authorPersonId: string;
  authorName: string;
  repliesToId: string | null;
  text: string | null;
  referenceDate: string;
  status: JournalEntryStatus;
  removalReason: string | null;
  removedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
}

export interface JournalEntryOwnership {
  id: string;
  studentId: string;
  classId: string;
  authorId: string;
  status: JournalEntryStatus;
}
