import { db } from '@config/database.js';
import { FindListJournalEntriesUseCase } from '@modules/application/use-cases/students/journal/find-list-journal-entries/find-list-journal-entries.usecase.js';
import { JournalEntryRepository } from '@modules/infra/repositories/journal-entry.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { FindListJournalEntriesController } from '@modules/presentation/controllers/students/journal/find-list-journal-entries/find-list-journal-entries.controller.js';

export const makeFindListJournalEntriesController = (): FindListJournalEntriesController =>
  new FindListJournalEntriesController(
    new FindListJournalEntriesUseCase(
      new StudentRepository(db.core),
      new JournalEntryRepository(db.core),
    ),
  );
