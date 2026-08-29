import { Enrollment } from '../entities/enrollment.js';
import { PageInfo } from './pagination.js';

export interface ListEnrollmentsFilters {
  page: number;
  limit: number;
  studentId: string | null;
  classId: string | null;
  /** `true` só as vigentes, `false` só as encerradas, `null` todas. */
  active: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListEnrollmentsResult {
  items: Enrollment[];
  pagination: PageInfo;
}

export interface CreateEnrollmentData {
  studentId: string;
  classId: string;
  startDate: string | null;
}

export interface IEnrollmentRepository {
  list(filters: ListEnrollmentsFilters): Promise<ListEnrollmentsResult>;
  findById(
    enrollmentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Enrollment | null>;

  /** `null` quando já existe matrícula vigente do aluno naquela turma. */
  create(data: CreateEnrollmentData): Promise<string | null>;

  /** `false` quando a matrícula já estava encerrada. */
  revoke(enrollmentId: string, endDate: string | null): Promise<boolean>;
}
