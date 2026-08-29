import { Teacher } from '../entities/teacher.js';
import { PageInfo } from './pagination.js';

export interface ListTeachersFilters {
  page: number;
  limit: number;
  /** Professores vinculados a uma turma específica. */
  classId: string | null;
  search: string | null;
  active: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListTeachersResult {
  items: Teacher[];
  pagination: PageInfo;
}

export interface CreateTeacherData {
  personId: string;
  registration: string | null;
  education: string | null;
  actorId: string;
}

export interface UpdateTeacherData {
  registration?: string | null;
  education?: string | null;
  active?: boolean;
}

export interface ITeacherRepository {
  list(filters: ListTeachersFilters): Promise<ListTeachersResult>;
  findById(teacherId: string, actorId: string, viewerId: string | null): Promise<Teacher | null>;

  /** Quem já é professor com esta pessoa (`professor.pessoa_id` é UNIQUE). */
  findIdByPersonId(personId: string): Promise<string | null>;

  create(data: CreateTeacherData): Promise<string | null>;
  update(teacherId: string, data: UpdateTeacherData): Promise<boolean>;
}
