import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Student } from '../../../../domain/entities/student.js';
import { IPersonRepository } from '../../../../domain/repositories/i-person-repository.js';
import {
  CreateStudentData,
  IStudentRepository,
} from '../../../../domain/repositories/i-student-repository.js';

export class CreateStudentUseCase {
  constructor(
    private readonly studentRepo: IStudentRepository,
    private readonly personRepo: IPersonRepository,
  ) {}

  async execute(data: CreateStudentData): Promise<Student> {
    const person = await this.personRepo.findById(data.personId, data.actorId, null);
    if (!person) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    // Sem exigência de CPF aqui: criança sem CPF é a regra, e a duplicata de aluno é barrada
    // pelo UNIQUE de `pessoa_id`, que não depende do documento.
    const studentId = await this.studentRepo.create(data);
    if (!studentId) {
      const existing = await this.studentRepo.findIdByPersonId(data.personId);

      throw new ConflictError({
        message: 'Esta pessoa já é aluno',
        cause: { studentId: existing },
      });
    }

    // `viewerId` null: quem cadastrou ainda não tem vínculo com a criança, e o recorte de
    // leitura a esconderia de quem acabou de criá-la.
    const student = await this.studentRepo.findById(studentId, data.actorId, null);
    if (!student) throw new InternalServerError({ message: 'Aluno gravado mas não relido' });

    return student;
  }
}
