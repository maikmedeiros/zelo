import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { RoleGrant } from '../../../domain/entities/role-grant.js';

export interface RoleGrantOutput {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  grantedById: string | null;
  grantedByName: string | null;
  startDate: string;
  endDate: string | null;
}

export interface RoleGrantPersistenceRow extends PaginatedRow {
  ID: string;
  USUARIO_ID: string;
  NOME_USUARIO: string;
  PERFIL_ID: string;
  CODIGO_PERFIL: string;
  NOME_PERFIL: string;
  CONCEDIDO_POR: string | null;
  NOME_CONCEDENTE: string | null;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export class RoleGrantMapper {
  static fromPersistence(row: RoleGrantPersistenceRow): RoleGrant {
    return {
      id: row.ID,
      userId: row.USUARIO_ID,
      userName: formatPersonName(row.NOME_USUARIO),
      roleId: row.PERFIL_ID,
      roleCode: row.CODIGO_PERFIL,
      roleName: row.NOME_PERFIL,
      grantedById: row.CONCEDIDO_POR,
      grantedByName: row.NOME_CONCEDENTE ? formatPersonName(row.NOME_CONCEDENTE) : null,
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
    };
  }

  static toOutput(grant: RoleGrant): RoleGrantOutput {
    return { ...grant };
  }
}
