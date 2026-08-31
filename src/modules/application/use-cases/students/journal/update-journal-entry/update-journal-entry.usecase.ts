import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { JournalEntry } from '../../../../../domain/entities/journal-entry.js';
import { IJournalEntryRepository } from '../../../../../domain/repositories/i-journal-entry-repository.js';
import { JournalGuard } from '../journal-guard.js';

export interface UpdateJournalEntryUseCaseInput {
  entryId: string;
  studentId: string;
  text: string;
  actorId: string;
  viewerId: string | null;
  guard: JournalGuard;
}

export class UpdateJournalEntryUseCase {
  constructor(private readonly journalRepo: IJournalEntryRepository) {}

  async execute(input: UpdateJournalEntryUseCaseInput): Promise<JournalEntry> {
    const ownership = await this.journalRepo.findOwnership(input.entryId, input.studentId);

    if (!ownership || !input.guard(ownership)) {
      throw new NotFoundError({ message: 'Recado não encontrado' });
    }

    if (ownership.status !== 'PUBLICADA') {
      throw new ConflictError({ message: 'Recado removido não é alterado' });
    }

    const alterou = await this.journalRepo.update(input.entryId, input.studentId, input.text);
    if (!alterou) throw new NotFoundError({ message: 'Recado não encontrado' });

    const entry = await this.journalRepo.findById(
      input.entryId,
      input.studentId,
      input.actorId,
      input.viewerId,
    );

    if (!entry) throw new NotFoundError({ message: 'Recado não encontrado' });

    return entry;
  }
}
