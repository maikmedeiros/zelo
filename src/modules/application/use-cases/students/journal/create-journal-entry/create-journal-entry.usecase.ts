import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { JournalEntry } from '../../../../../domain/entities/journal-entry.js';
import { IJournalEntryRepository } from '../../../../../domain/repositories/i-journal-entry-repository.js';
import { IStudentRepository } from '../../../../../domain/repositories/i-student-repository.js';

export interface CreateJournalEntryUseCaseInput {
  studentId: string;
  text: string;
  referenceDate: string | null;
  repliesToId: string | null;
  actorId: string;
  viewerId: string | null;
}

export class CreateJournalEntryUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly journalRepo: IJournalEntryRepository,
  ) {}

  async execute(input: CreateJournalEntryUseCaseInput): Promise<JournalEntry> {
    const student = await this.studentRepo.findById(input.studentId, input.actorId, input.viewerId);

    if (!student) {
      throw new NotFoundError({ message: 'Aluno não encontrado' });
    }

    if (input.repliesToId !== null) {
      const alvo = await this.journalRepo.findOwnership(input.repliesToId, input.studentId);

      if (!alvo) {
        throw new UnprocessableEntityError({
          message: 'O recado respondido não pertence à agenda desta criança',
          cause: { campo: 'repliesToId' },
        });
      }
    }

    const entry = await this.journalRepo.create({
      studentId: input.studentId,
      authorId: input.actorId,
      repliesToId: input.repliesToId,
      text: input.text,
      referenceDate: input.referenceDate,
    });

    if (!entry) {
      throw new UnprocessableEntityError({
        message: 'A criança não tem matrícula vigente: não há turma para o recado',
      });
    }

    return entry;
  }
}
