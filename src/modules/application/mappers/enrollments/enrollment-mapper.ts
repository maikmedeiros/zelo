import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Enrollment } from '../../../domain/entities/enrollment.js';

export interface EnrollmentOutput {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  startDate: string;
  endDate: string | null;
}

export interface EnrollmentPersistenceRow extends PaginatedRow {
  ID: string;
  ALUNO_ID: string;
  NOME_ALUNO: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export class EnrollmentMapper {
  static fromPersistence(row: EnrollmentPersistenceRow): Enrollment {
    return {
      id: row.ID,
      studentId: row.ALUNO_ID,
      studentName: formatPersonName(row.NOME_ALUNO),
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
    };
  }

  static toOutput(enrollment: Enrollment): EnrollmentOutput {
    return { ...enrollment };
  }
}
