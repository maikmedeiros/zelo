import { JournalEntry, JournalEntryOwnership } from '../entities/journal-entry.js';
import { PageInfo } from './pagination.js';

export interface ListJournalEntriesFilters {
  page: number;
  limit: number;
  studentId: string;
  referenceDate: string | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListJournalEntriesResult {
  items: JournalEntry[];
  pagination: PageInfo;
}

export interface CreateJournalEntryData {
  studentId: string;
  authorId: string;
  repliesToId: string | null;
  text: string;
  referenceDate: string | null;
}

export interface RemoveJournalEntryData {
  entryId: string;
  studentId: string;
  removedBy: string;
  byAuthor: boolean;
  reason: string | null;
}

export interface IJournalEntryRepository {
  list(filters: ListJournalEntriesFilters): Promise<ListJournalEntriesResult>;

  findById(
    entryId: string,
    studentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<JournalEntry | null>;

  findOwnership(entryId: string, studentId: string): Promise<JournalEntryOwnership | null>;

  create(data: CreateJournalEntryData): Promise<JournalEntry | null>;
  update(entryId: string, studentId: string, text: string): Promise<boolean>;
  remove(data: RemoveJournalEntryData): Promise<boolean>;
}
