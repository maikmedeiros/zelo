import { PaginatedRow } from '@shared/infra/database/index.js';
import { Class, ClassShift } from '../../../domain/entities/class.js';

export interface ClassOutput {
  id: string;
  name: string;
  segment: string;
  shift: ClassShift;
  schoolYearId: string;
  schoolYear: number;
  studentCount: number;
}

export interface ClassPersistenceRow extends PaginatedRow {
  ID: string;
  NOME: string;
  SEGMENTO: string;
  TURNO: ClassShift;
  ANO_LETIVO_ID: string;
  ANO: number;
  TOTAL_ALUNO: number;
}

export class ClassMapper {
  static fromPersistence(row: ClassPersistenceRow): Class {
    return {
      id: row.ID,
      name: row.NOME,
      segment: row.SEGMENTO,
      shift: row.TURNO,
      schoolYearId: row.ANO_LETIVO_ID,
      schoolYear: Number(row.ANO),
      studentCount: Number(row.TOTAL_ALUNO),
    };
  }

  static toOutput(turma: Class): ClassOutput {
    return { ...turma };
  }
}
