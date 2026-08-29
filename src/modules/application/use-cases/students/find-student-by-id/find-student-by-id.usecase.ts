import { NotFoundError } from '@shared/errors/index.js';
import { Student } from '../../../../domain/entities/student.js';
import { IStudentRepository } from '../../../../domain/repositories/i-student-repository.js';

export class FindStudentByIdUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(studentId: string, actorId: string, viewerId: string | null): Promise<Student> {
    const student = await this.studentRepo.findById(studentId, actorId, viewerId);

    // 404, nunca 403: negar por permissão confirmaria que a criança existe.
    if (!student) throw new NotFoundError({ message: 'Aluno não encontrado' });

    return student;
  }
}
