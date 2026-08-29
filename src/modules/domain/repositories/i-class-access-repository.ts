import { AccessReason, ClassAccess } from '../entities/class-access.js';
import { PageInfo } from './pagination.js';

export interface ListClassAccessesFilters {
  page: number;
  limit: number;
  userId: string | null;
  classId: string | null;
  active: boolean | null;
  actorId: string;
  viewerId: string | null;
}

export interface ListClassAccessesResult {
  items: ClassAccess[];
  pagination: PageInfo;
}

export interface CreateClassAccessData {
  userId: string;
  classId: string;
  reason: AccessReason;
  justification: string | null;
  startDate: string | null;
  /** Quem concedeu — sai do ator, nunca do corpo. */
  grantedBy: string;
}

export interface IClassAccessRepository {
  list(filters: ListClassAccessesFilters): Promise<ListClassAccessesResult>;
  findById(accessId: string, actorId: string, viewerId: string | null): Promise<ClassAccess | null>;

  /** `null` quando já existe acesso vigente deste usuário a esta turma. */
  create(data: CreateClassAccessData): Promise<string | null>;

  /** `false` quando o acesso já estava encerrado. */
  revoke(accessId: string): Promise<boolean>;
}
