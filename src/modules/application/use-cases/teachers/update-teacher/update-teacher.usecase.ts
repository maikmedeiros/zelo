import { InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Teacher } from '../../../../domain/entities/teacher.js';
import {
  ITeacherRepository,
  UpdateTeacherData,
} from '../../../../domain/repositories/i-teacher-repository.js';

export class UpdateTeacherUseCase {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(teacherId: string, data: UpdateTeacherData, actorId: string): Promise<Teacher> {
    const atual = await this.teacherRepo.findById(teacherId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Professor não encontrado' });

    const alterado = await this.teacherRepo.update(teacherId, data);
    if (!alterado) throw new InternalServerError({ message: 'Professor não pôde ser alterado' });

    const teacher = await this.teacherRepo.findById(teacherId, actorId, null);
    if (!teacher) throw new InternalServerError({ message: 'Professor alterado mas não relido' });

    return teacher;
  }
}
