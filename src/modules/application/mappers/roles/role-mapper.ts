import { Scope } from '@shared/auth/index.js';
import { PaginatedRow } from '@shared/infra/database/index.js';
import { Role, RolePermission } from '../../../domain/entities/role.js';

interface PermissionRow {
  CODIGO: string;
  ABRANGENCIA: Scope;
}

export interface RoleOutput {
  id: string;
  code: string;
  name: string;
  description: string | null;
  system: boolean;
  permissions: RolePermission[];
  userCount: number;
}

export interface RolePersistenceRow extends PaginatedRow {
  ID: string;
  CODIGO: string;
  NOME: string;
  DESCRICAO: string | null;
  SISTEMA: boolean;
  PERMISSOES: PermissionRow[] | null;
  TOTAL_USUARIO: number;
}

const toPermission = (row: PermissionRow): RolePermission => ({
  code: row.CODIGO,
  scope: row.ABRANGENCIA,
});

export class RoleMapper {
  static fromPersistence(row: RolePersistenceRow): Role {
    return {
      id: row.ID,
      code: row.CODIGO,
      name: row.NOME,
      description: row.DESCRICAO,
      system: row.SISTEMA,
      permissions: (row.PERMISSOES ?? []).map(toPermission),
      userCount: Number(row.TOTAL_USUARIO),
    };
  }

  static toOutput(role: Role): RoleOutput {
    return { ...role };
  }
}
