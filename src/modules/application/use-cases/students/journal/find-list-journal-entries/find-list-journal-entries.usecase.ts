import { NotFoundError } from '@shared/errors/index.js';
import {
  IJournalEntryRepository,
  ListJournalEntriesResult,
} from '../../../../../domain/repositories/i-journal-entry-repository.js';
import { IStudentRepository } from '../../../../../domain/repositories/i-student-repository.js';

export interface ListJournalEntriesInput {
  studentId: string;
  page: number;
  limit: number;
  referenceDate: string | null;
  actorId: string;
  viewerId: string | null;
}

export class FindListJournalEntriesUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly journalRepo: IJournalEntryRepository,
  ) {}

  async execute(input: ListJournalEntriesInput): Promise<ListJournalEntriesResult> {
    const student = await this.studentRepo.findById(input.studentId, input.actorId, input.viewerId);

    if (!student) {
      throw new NotFoundError({ message: 'Aluno não encontrado' });
    }

    return this.journalRepo.list({
      studentId: input.studentId,
      page: input.page,
      limit: input.limit,
      referenceDate: input.referenceDate,
      actorId: input.actorId,
      viewerId: input.viewerId,
    });
  }
}
