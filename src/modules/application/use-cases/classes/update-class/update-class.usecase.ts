import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Class } from '../../../../domain/entities/class.js';
import {
  IClassRepository,
  UpdateClassData,
} from '../../../../domain/repositories/i-class-repository.js';

export class UpdateClassUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  async execute(classId: string, data: UpdateClassData, actorId: string): Promise<Class> {
    // `viewerId` null: quem tem UPDATE:CLASS altera turma da escola, e exigir vínculo aqui
    // esconderia da coordenação a turma que ela mesma acabou de cadastrar.
    const atual = await this.classRepo.findById(classId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Turma não encontrada' });

    // Já existe (o findById passou), então zero linhas aqui é colisão de `uq_turma`.
    const alterado = await this.classRepo.update(classId, data);
    if (!alterado) {
      throw new ConflictError({
        message: 'Já existe uma turma com este nome e turno neste ano letivo',
        cause: { name: data.name ?? atual.name, shift: data.shift ?? atual.shift },
      });
    }

    const turma = await this.classRepo.findById(classId, actorId, null);
    if (!turma) throw new InternalServerError({ message: 'Turma alterada mas não relida' });

    return turma;
  }
}
