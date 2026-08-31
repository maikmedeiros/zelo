import { NotFoundError } from '@shared/errors/index.js';
import { IClassRepository } from '../../../../../domain/repositories/i-class-repository.js';
import {
  IConsentRepository,
  ListClassConsentsResult,
} from '../../../../../domain/repositories/i-consent-repository.js';

export interface ListClassConsentsInput {
  classId: string;
  page: number;
  limit: number;
  actorId: string;
  viewerId: string | null;
}

export class FindListClassConsentsUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly consentRepo: IConsentRepository,
  ) {}

  async execute(input: ListClassConsentsInput): Promise<ListClassConsentsResult> {
    const turma = await this.classRepo.findById(input.classId, input.actorId, input.viewerId);

    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    return this.consentRepo.listByClass({
      classId: input.classId,
      page: input.page,
      limit: input.limit,
      actorId: input.actorId,
      viewerId: input.viewerId,
    });
  }
}
