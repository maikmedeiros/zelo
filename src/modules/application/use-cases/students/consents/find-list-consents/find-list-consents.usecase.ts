import { NotFoundError } from '@shared/errors/index.js';
import { ConsentType } from '../../../../../domain/entities/consent.js';
import {
  IConsentRepository,
  ListConsentsResult,
} from '../../../../../domain/repositories/i-consent-repository.js';
import { IStudentRepository } from '../../../../../domain/repositories/i-student-repository.js';

export interface ListConsentsInput {
  studentId: string;
  page: number;
  limit: number;
  type: ConsentType | null;
  current: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export class FindListConsentsUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly consentRepo: IConsentRepository,
  ) {}

  async execute(input: ListConsentsInput): Promise<ListConsentsResult> {
    const student = await this.studentRepo.findById(input.studentId, input.actorId, input.viewerId);

    if (!student) {
      throw new NotFoundError({ message: 'Aluno não encontrado' });
    }

    return this.consentRepo.list({
      studentId: input.studentId,
      page: input.page,
      limit: input.limit,
      type: input.type,
      current: input.current,
      actorId: input.actorId,
      viewerId: input.viewerId,
    });
  }
}
