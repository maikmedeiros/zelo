import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IJournalEntryRepository } from '../../../../../domain/repositories/i-journal-entry-repository.js';
import { JournalGuard } from '../journal-guard.js';

export interface DeleteJournalEntryUseCaseInput {
  entryId: string;
  studentId: string;
  actorId: string;
  reason: string | null;
  guard: JournalGuard;
}

export class DeleteJournalEntryUseCase {
  constructor(private readonly journalRepo: IJournalEntryRepository) {}

  async execute(input: DeleteJournalEntryUseCaseInput): Promise<void> {
    const ownership = await this.journalRepo.findOwnership(input.entryId, input.studentId);

    if (!ownership || !input.guard(ownership)) {
      throw new NotFoundError({ message: 'Recado não encontrado' });
    }

    const byAuthor = ownership.authorId === input.actorId;

    if (!byAuthor && !input.reason) {
      throw new UnprocessableEntityError({
        message: 'A remoção pela escola exige o motivo',
        cause: { campo: 'reason' },
      });
    }

    const removeu = await this.journalRepo.remove({
      entryId: input.entryId,
      studentId: input.studentId,
      removedBy: input.actorId,
      byAuthor,
      reason: byAuthor ? null : (input.reason ?? null),
    });

    if (!removeu) throw new NotFoundError({ message: 'Recado não encontrado' });
  }
}
