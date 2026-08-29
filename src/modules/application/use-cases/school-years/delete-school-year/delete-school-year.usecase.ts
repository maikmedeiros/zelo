import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { ISchoolYearRepository } from '../../../../domain/repositories/i-school-year-repository.js';

export class DeleteSchoolYearUseCase {
  constructor(private readonly schoolYearRepo: ISchoolYearRepository) {}

  async execute(schoolYearId: string, actorId: string): Promise<void> {
    const schoolYear = await this.schoolYearRepo.findById(schoolYearId, actorId);
    if (!schoolYear) throw new NotFoundError({ message: 'Ano letivo não encontrado' });

    // Cadastro não tem remoção lógica: quem foi usado não sai, quem não foi é erro de
    // digitação. `turma.ano_letivo_id` é RESTRICT, e a guarda do WHERE devolve o 409 no
    // lugar do erro de FK.
    const removido = await this.schoolYearRepo.delete(schoolYearId);
    if (!removido) {
      throw new ConflictError({
        message: 'Ano letivo com turmas não pode ser removido',
        cause: { classCount: schoolYear.classCount },
      });
    }
  }
}
