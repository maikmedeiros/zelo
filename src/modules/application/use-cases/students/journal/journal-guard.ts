import { JournalEntryOwnership } from '../../../../domain/entities/journal-entry.js';

export type JournalGuard = (ownership: JournalEntryOwnership) => boolean;
