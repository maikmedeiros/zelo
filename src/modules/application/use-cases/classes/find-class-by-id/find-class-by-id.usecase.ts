import { NotFoundError } from '@shared/errors/index.js';
import { Class } from '../../../../domain/entities/class.js';
import { IClassRepository } from '../../../../domain/repositories/i-class-repository.js';

export class FindClassByIdUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  async execute(classId: string, actorId: string, viewerId: string | null): Promise<Class> {
    const turma = await this.classRepo.findById(classId, actorId, viewerId);

    // 404, nunca 403: negar por permissão confirmaria que a turma existe.
    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    return turma;
  }
}
