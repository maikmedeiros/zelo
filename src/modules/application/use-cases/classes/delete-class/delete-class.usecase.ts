import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IClassRepository } from '../../../../domain/repositories/i-class-repository.js';

export class DeleteClassUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  async execute(classId: string, actorId: string): Promise<void> {
    const turma = await this.classRepo.findById(classId, actorId, null);
    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    // Cadastro não tem remoção lógica. Turma que já recebeu matrícula, vínculo ou postagem
    // carrega histórico, e apagá-la levaria o histórico junto — por isso 409, não cascata.
    const removido = await this.classRepo.delete(classId);
    if (!removido) {
      throw new ConflictError({
        message: 'Turma já utilizada não pode ser removida',
        cause: { studentCount: turma.studentCount },
      });
    }
  }
}
