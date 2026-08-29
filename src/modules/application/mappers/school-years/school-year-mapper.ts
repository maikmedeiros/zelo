import { PaginatedRow } from '@shared/infra/database/index.js';
import { SchoolYear } from '../../../domain/entities/school-year.js';

export interface SchoolYearOutput {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  classCount: number;
}

export interface SchoolYearPersistenceRow extends PaginatedRow {
  ID: string;
  ANO: number;
  DATA_INICIO: string;
  DATA_FIM: string;
  TOTAL_TURMA: number;
}

export class SchoolYearMapper {
  static fromPersistence(row: SchoolYearPersistenceRow): SchoolYear {
    return {
      id: row.ID,
      year: Number(row.ANO),
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
      classCount: Number(row.TOTAL_TURMA),
    };
  }

  static toOutput(schoolYear: SchoolYear): SchoolYearOutput {
    return { ...schoolYear };
  }
}
