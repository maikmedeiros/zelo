import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IStudentRepository } from '../../../../domain/repositories/i-student-repository.js';

export class DeleteStudentUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(studentId: string, actorId: string): Promise<void> {
    const student = await this.studentRepo.findById(studentId, actorId, null);
    if (!student) throw new NotFoundError({ message: 'Aluno não encontrado' });

    // A remoção física serve só para desfazer o erro de digitação recém-cometido. Criança
    // que já foi matriculada, vinculada ou citada em postagem sai por `PATCH { active:
    // false }` — apagar levaria o histórico de convivência junto.
    const removido = await this.studentRepo.delete(studentId);
    if (!removido) {
      throw new ConflictError({
        message: 'Aluno com histórico não pode ser removido; desative com PATCH { active: false }',
      });
    }
  }
}
