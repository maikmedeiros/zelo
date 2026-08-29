import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Teacher } from '../../../domain/entities/teacher.js';

export interface TeacherOutput {
  id: string;
  personId: string;
  personName: string;
  cpf: string | null;
  registration: string | null;
  education: string | null;
  active: boolean;
  classCount: number;
}

export interface TeacherPersistenceRow extends PaginatedRow {
  ID: string;
  PESSOA_ID: string;
  NOME_PESSOA: string;
  CPF: string | null;
  REGISTRO: string | null;
  FORMACAO: string | null;
  ATIVO: boolean;
  TOTAL_TURMA: number;
}

export class TeacherMapper {
  static fromPersistence(row: TeacherPersistenceRow): Teacher {
    return {
      id: row.ID,
      personId: row.PESSOA_ID,
      personName: formatPersonName(row.NOME_PESSOA),
      cpf: row.CPF,
      registration: row.REGISTRO,
      education: row.FORMACAO,
      active: row.ATIVO,
      classCount: Number(row.TOTAL_TURMA),
    };
  }

  static toOutput(teacher: Teacher): TeacherOutput {
    return { ...teacher };
  }
}
