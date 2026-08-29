import { RoleGrant } from '../entities/role-grant.js';
import { PageInfo } from './pagination.js';

export interface ListRoleGrantsFilters {
  page: number;
  limit: number;
  userId: string | null;
  roleId: string | null;
  active: boolean | null;
  actorId: string;
}

export interface ListRoleGrantsResult {
  items: RoleGrant[];
  pagination: PageInfo;
}

export interface CreateRoleGrantData {
  userId: string;
  roleId: string;
  startDate: string | null;
  /** Quem concedeu — sai do ator, nunca do corpo. */
  grantedBy: string;
}

export interface IRoleGrantRepository {
  list(filters: ListRoleGrantsFilters): Promise<ListRoleGrantsResult>;
  findById(grantId: string, actorId: string): Promise<RoleGrant | null>;

  /** `null` quando o usuário já tem este perfil com concessão vigente. */
  create(data: CreateRoleGrantData): Promise<string | null>;

  /** `false` quando a concessão já estava encerrada. */
  revoke(grantId: string): Promise<boolean>;
}
