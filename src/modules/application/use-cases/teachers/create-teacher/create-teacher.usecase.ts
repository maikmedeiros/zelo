import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Teacher } from '../../../../domain/entities/teacher.js';
import { IPersonRepository } from '../../../../domain/repositories/i-person-repository.js';
import {
  CreateTeacherData,
  ITeacherRepository,
} from '../../../../domain/repositories/i-teacher-repository.js';
import { assertPersonHasCpf } from '../../people/assert-person-has-cpf.js';

export class CreateTeacherUseCase {
  constructor(
    private readonly teacherRepo: ITeacherRepository,
    private readonly personRepo: IPersonRepository,
  ) {}

  async execute(data: CreateTeacherData): Promise<Teacher> {
    const person = await this.personRepo.findById(data.personId, data.actorId, null);
    if (!person) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    assertPersonHasCpf(person, 'professor');

    const teacherId = await this.teacherRepo.create(data);
    if (!teacherId) {
      const existing = await this.teacherRepo.findIdByPersonId(data.personId);

      throw new ConflictError({
        message: 'Esta pessoa já é professor',
        cause: { teacherId: existing },
      });
    }

    // `viewerId` null: o professor recém-criado ainda não tem turma, e o recorte de leitura
    // o esconderia de quem acabou de cadastrá-lo.
    const teacher = await this.teacherRepo.findById(teacherId, data.actorId, null);
    if (!teacher) throw new InternalServerError({ message: 'Professor gravado mas não relido' });

    return teacher;
  }
}
