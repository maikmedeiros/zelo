import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { TeacherLink, TeacherRole } from '../../../domain/entities/teacher-link.js';

export interface TeacherLinkOutput {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  role: TeacherRole;
  startDate: string;
  endDate: string | null;
}

export interface TeacherLinkPersistenceRow extends PaginatedRow {
  ID: string;
  PROFESSOR_ID: string;
  NOME_PROFESSOR: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  FUNCAO: TeacherRole;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export class TeacherLinkMapper {
  static fromPersistence(row: TeacherLinkPersistenceRow): TeacherLink {
    return {
      id: row.ID,
      teacherId: row.PROFESSOR_ID,
      teacherName: formatPersonName(row.NOME_PROFESSOR),
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      role: row.FUNCAO,
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
    };
  }

  static toOutput(link: TeacherLink): TeacherLinkOutput {
    return { ...link };
  }
}
