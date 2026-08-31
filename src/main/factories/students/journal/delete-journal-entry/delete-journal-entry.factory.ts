import { db } from '@config/database.js';
import { DeleteJournalEntryUseCase } from '@modules/application/use-cases/students/journal/delete-journal-entry/delete-journal-entry.usecase.js';
import { JournalEntryRepository } from '@modules/infra/repositories/journal-entry.repository.js';
import { DeleteJournalEntryController } from '@modules/presentation/controllers/students/journal/delete-journal-entry/delete-journal-entry.controller.js';

export const makeDeleteJournalEntryController = (): DeleteJournalEntryController =>
  new DeleteJournalEntryController(
    new DeleteJournalEntryUseCase(new JournalEntryRepository(db.core)),
  );
