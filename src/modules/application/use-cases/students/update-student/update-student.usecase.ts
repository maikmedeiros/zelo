import { InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Student } from '../../../../domain/entities/student.js';
import {
  IStudentRepository,
  UpdateStudentData,
} from '../../../../domain/repositories/i-student-repository.js';

export class UpdateStudentUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(studentId: string, data: UpdateStudentData, actorId: string): Promise<Student> {
    const atual = await this.studentRepo.findById(studentId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Aluno não encontrado' });

    const alterado = await this.studentRepo.update(studentId, data);
    if (!alterado) throw new InternalServerError({ message: 'Aluno não pôde ser alterado' });

    const student = await this.studentRepo.findById(studentId, actorId, null);
    if (!student) throw new InternalServerError({ message: 'Aluno alterado mas não relido' });

    return student;
  }
}
