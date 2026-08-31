import { db } from '@config/database.js';
import { UpdateJournalEntryUseCase } from '@modules/application/use-cases/students/journal/update-journal-entry/update-journal-entry.usecase.js';
import { JournalEntryRepository } from '@modules/infra/repositories/journal-entry.repository.js';
import { UpdateJournalEntryController } from '@modules/presentation/controllers/students/journal/update-journal-entry/update-journal-entry.controller.js';

export const makeUpdateJournalEntryController = (): UpdateJournalEntryController =>
  new UpdateJournalEntryController(
    new UpdateJournalEntryUseCase(new JournalEntryRepository(db.core)),
  );
