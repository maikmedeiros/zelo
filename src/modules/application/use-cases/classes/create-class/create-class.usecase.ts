import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Class } from '../../../../domain/entities/class.js';
import {
  CreateClassData,
  IClassRepository,
} from '../../../../domain/repositories/i-class-repository.js';
import { ISchoolYearRepository } from '../../../../domain/repositories/i-school-year-repository.js';

export class CreateClassUseCase {
  constructor(
    private readonly classRepo: IClassRepository,
    private readonly schoolYearRepo: ISchoolYearRepository,
  ) {}

  async execute(data: CreateClassData): Promise<Class> {
    // Confere o ano letivo antes de inserir para que o recordset vazio do INSERT tenha uma
    // causa só: a colisão de `uq_turma`. Sem isso, "ano letivo inexistente" e "turma
    // duplicada" chegariam indistinguíveis.
    const schoolYear = await this.schoolYearRepo.findById(data.schoolYearId, data.actorId);
    if (!schoolYear) throw new NotFoundError({ message: 'Ano letivo não encontrado' });

    const classId = await this.classRepo.create(data);
    if (!classId) {
      throw new ConflictError({
        message: 'Já existe uma turma com este nome e turno neste ano letivo',
        cause: { name: data.name, shift: data.shift, schoolYear: schoolYear.year },
      });
    }

    // `viewerId` null: a escrita já foi autorizada, e quem acabou de criar a turma ainda não
    // tem vínculo com ela — o recorte de leitura a esconderia do próprio autor.
    const turma = await this.classRepo.findById(classId, data.actorId, null);
    if (!turma) throw new InternalServerError({ message: 'Turma gravada mas não relida' });

    return turma;
  }
}
