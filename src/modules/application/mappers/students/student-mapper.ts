import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Student } from '../../../domain/entities/student.js';

export interface StudentOutput {
  id: string;
  personId: string;
  personName: string;
  birthDate: string | null;
  code: string | null;
  notes: string | null;
  active: boolean;
  classId: string | null;
  className: string | null;
}

export interface StudentPersistenceRow extends PaginatedRow {
  ID: string;
  PESSOA_ID: string;
  NOME_PESSOA: string;
  DATA_NASCIMENTO: string | null;
  CODIGO: string | null;
  OBSERVACOES: string | null;
  ATIVO: boolean;
  TURMA_ID: string | null;
  NOME_TURMA: string | null;
}

export class StudentMapper {
  static fromPersistence(row: StudentPersistenceRow): Student {
    return {
      id: row.ID,
      personId: row.PESSOA_ID,
      personName: formatPersonName(row.NOME_PESSOA),
      birthDate: row.DATA_NASCIMENTO,
      code: row.CODIGO,
      notes: row.OBSERVACOES,
      active: row.ATIVO,
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
    };
  }

  static toOutput(student: Student): StudentOutput {
    return { ...student };
  }
}
