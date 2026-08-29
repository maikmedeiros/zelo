import { Student } from '../entities/student.js';
import { PageInfo } from './pagination.js';

export interface ListStudentsFilters {
  page: number;
  limit: number;
  classId: string | null;
  search: string | null;
  active: boolean | null;
  actorId: string;
  // `null` é o ator de abrangência ESCOLA. Quem decide é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListStudentsResult {
  items: Student[];
  pagination: PageInfo;
}

export interface CreateStudentData {
  personId: string;
  code: string | null;
  notes: string | null;
  actorId: string;
}

export interface UpdateStudentData {
  code?: string | null;
  notes?: string | null;
  active?: boolean;
}

export interface IStudentRepository {
  list(filters: ListStudentsFilters): Promise<ListStudentsResult>;
  findById(studentId: string, actorId: string, viewerId: string | null): Promise<Student | null>;

  /** Quem já é aluno com esta pessoa (`aluno.pessoa_id` é UNIQUE). */
  findIdByPersonId(personId: string): Promise<string | null>;

  /** `null` quando a pessoa já tem o papel de aluno. */
  create(data: CreateStudentData): Promise<string | null>;
  update(studentId: string, data: UpdateStudentData): Promise<boolean>;

  /** `false` quando o aluno já foi matriculado, vinculado ou endereçado por uma postagem. */
  delete(studentId: string): Promise<boolean>;
}
