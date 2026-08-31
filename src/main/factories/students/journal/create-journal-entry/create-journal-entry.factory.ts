import { db } from '@config/database.js';
import { CreateJournalEntryUseCase } from '@modules/application/use-cases/students/journal/create-journal-entry/create-journal-entry.usecase.js';
import { JournalEntryRepository } from '@modules/infra/repositories/journal-entry.repository.js';
import { StudentRepository } from '@modules/infra/repositories/student.repository.js';
import { CreateJournalEntryController } from '@modules/presentation/controllers/students/journal/create-journal-entry/create-journal-entry.controller.js';

export const makeCreateJournalEntryController = (): CreateJournalEntryController =>
  new CreateJournalEntryController(
    new CreateJournalEntryUseCase(
      new StudentRepository(db.core),
      new JournalEntryRepository(db.core),
    ),
  );
