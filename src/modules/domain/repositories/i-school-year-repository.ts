import { SchoolYear } from '../entities/school-year.js';
import { PageInfo } from './pagination.js';

export interface ListSchoolYearsFilters {
  page: number;
  limit: number;
  year: number | null;
  /** A escola sai do ator, nunca do cliente. */
  actorId: string;
}

export interface ListSchoolYearsResult {
  items: SchoolYear[];
  pagination: PageInfo;
}

export interface CreateSchoolYearData {
  year: number;
  startDate: string;
  endDate: string;
  actorId: string;
}

export interface UpdateSchoolYearData {
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface ISchoolYearRepository {
  list(filters: ListSchoolYearsFilters): Promise<ListSchoolYearsResult>;
  findById(schoolYearId: string, actorId: string): Promise<SchoolYear | null>;

  /** `null` quando o ano já existe na escola — o índice único recusou a linha. */
  create(data: CreateSchoolYearData): Promise<string | null>;

  /** `false` quando o novo `year` colide com outro ano letivo da mesma escola. */
  update(schoolYearId: string, data: UpdateSchoolYearData): Promise<boolean>;

  /** `false` quando alguma turma ainda referencia o ano letivo. */
  delete(schoolYearId: string): Promise<boolean>;
}
