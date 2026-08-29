import { Role, RolePermission } from '../entities/role.js';
import { PageInfo } from './pagination.js';

export interface ListRolesFilters {
  page: number;
  limit: number;
  search: string | null;
  actorId: string;
}

export interface ListRolesResult {
  items: Role[];
  pagination: PageInfo;
}

export interface CreateRoleData {
  code: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
  actorId: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string | null;
  /** Quando vem, **substitui** o conjunto inteiro. Concessão a menos é concessão removida. */
  permissions?: RolePermission[];
}

export interface IRoleRepository {
  list(filters: ListRolesFilters): Promise<ListRolesResult>;
  findById(roleId: string, actorId: string): Promise<Role | null>;

  /** As capabilities que não existem em `PERMISSAO` — vazio significa que todas existem. */
  findUnknownPermissions(codes: string[]): Promise<string[]>;

  /** `null` quando o código já existe na escola. */
  create(data: CreateRoleData): Promise<string | null>;
  update(roleId: string, data: UpdateRoleData): Promise<boolean>;

  /** Chamado dentro de transação, junto do `update`. */
  replacePermissions(roleId: string, permissions: RolePermission[]): Promise<void>;
}
