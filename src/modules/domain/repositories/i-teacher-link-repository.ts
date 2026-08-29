import { TeacherLink, TeacherRole } from '../entities/teacher-link.js';
import { PageInfo } from './pagination.js';

export interface ListTeacherLinksFilters {
  page: number;
  limit: number;
  teacherId: string | null;
  classId: string | null;
  active: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListTeacherLinksResult {
  items: TeacherLink[];
  pagination: PageInfo;
}

export interface CreateTeacherLinkData {
  teacherId: string;
  classId: string;
  role: TeacherRole;
  startDate: string | null;
}

export interface ITeacherLinkRepository {
  list(filters: ListTeacherLinksFilters): Promise<ListTeacherLinksResult>;
  findById(linkId: string, actorId: string, viewerId: string | null): Promise<TeacherLink | null>;

  /** `null` quando já existe vínculo vigente entre este professor e esta turma. */
  create(data: CreateTeacherLinkData): Promise<string | null>;

  /** `false` quando o vínculo já estava encerrado. */
  revoke(linkId: string): Promise<boolean>;
}
