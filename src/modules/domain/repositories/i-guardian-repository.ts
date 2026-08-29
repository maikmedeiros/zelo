import { Guardian } from '../entities/guardian.js';
import { PageInfo } from './pagination.js';

export interface ListGuardiansFilters {
  page: number;
  limit: number;
  /** Responsáveis de um aluno específico. */
  studentId: string | null;
  search: string | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListGuardiansResult {
  items: Guardian[];
  pagination: PageInfo;
}

export interface CreateGuardianData {
  personId: string;
  receiveEmail: boolean;
  receivePush: boolean;
  actorId: string;
}

export interface UpdateGuardianData {
  receiveEmail?: boolean;
  receivePush?: boolean;
}

export interface IGuardianRepository {
  list(filters: ListGuardiansFilters): Promise<ListGuardiansResult>;
  findById(guardianId: string, actorId: string, viewerId: string | null): Promise<Guardian | null>;

  /** Quem já é responsável com esta pessoa (`responsavel.pessoa_id` é UNIQUE). */
  findIdByPersonId(personId: string): Promise<string | null>;

  create(data: CreateGuardianData): Promise<string | null>;
  update(guardianId: string, data: UpdateGuardianData): Promise<boolean>;
}
