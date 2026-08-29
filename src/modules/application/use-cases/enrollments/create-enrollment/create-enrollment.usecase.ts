import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Enrollment } from '../../../../domain/entities/enrollment.js';
import { IClassRepository } from '../../../../domain/repositories/i-class-repository.js';
import {
  CreateEnrollmentData,
  IEnrollmentRepository,
} from '../../../../domain/repositories/i-enrollment-repository.js';
import { IStudentRepository } from '../../../../domain/repositories/i-student-repository.js';

export interface CreateEnrollmentInputData extends CreateEnrollmentData {
  actorId: string;
}

export class CreateEnrollmentUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly classRepo: IClassRepository,
  ) {}

  async execute(data: CreateEnrollmentInputData): Promise<Enrollment> {
    // As duas conferências antes do INSERT existem para que o recordset vazio tenha uma causa
    // só: a matrícula vigente duplicada. `viewerId` null porque a escrita já foi autorizada
    // pela capability — o recorte de leitura aqui esconderia turma que o operador pode usar.
    const student = await this.studentRepo.findById(data.studentId, data.actorId, null);
    if (!student) throw new NotFoundError({ message: 'Aluno não encontrado' });

    const turma = await this.classRepo.findById(data.classId, data.actorId, null);
    if (!turma) throw new NotFoundError({ message: 'Turma não encontrada' });

    const enrollmentId = await this.enrollmentRepo.create(data);
    if (!enrollmentId) {
      throw new ConflictError({
        message: 'Este aluno já tem matrícula vigente nesta turma',
        cause: { studentId: data.studentId, classId: data.classId },
      });
    }

    const enrollment = await this.enrollmentRepo.findById(enrollmentId, data.actorId, null);
    if (!enrollment) throw new InternalServerError({ message: 'Matrícula gravada mas não relida' });

    return enrollment;
  }
}
