import { NotFoundError } from '@shared/errors/index.js';
import { Teacher } from '../../../../domain/entities/teacher.js';
import { ITeacherRepository } from '../../../../domain/repositories/i-teacher-repository.js';

export class FindTeacherByIdUseCase {
  constructor(private readonly teacherRepo: ITeacherRepository) {}

  async execute(teacherId: string, actorId: string, viewerId: string | null): Promise<Teacher> {
    const teacher = await this.teacherRepo.findById(teacherId, actorId, viewerId);
    if (!teacher) throw new NotFoundError({ message: 'Professor não encontrado' });

    return teacher;
  }
}
