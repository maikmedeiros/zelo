import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { AccessReason, ClassAccess } from '../../../domain/entities/class-access.js';

export interface ClassAccessOutput {
  id: string;
  userId: string;
  userName: string;
  classId: string;
  className: string;
  reason: AccessReason;
  justification: string | null;
  grantedById: string;
  grantedByName: string;
  startDate: string;
  endDate: string | null;
}

export interface ClassAccessPersistenceRow extends PaginatedRow {
  ID: string;
  USUARIO_ID: string;
  NOME_USUARIO: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  MOTIVO: AccessReason;
  JUSTIFICATIVA: string | null;
  CONCEDIDO_POR: string;
  NOME_CONCEDENTE: string;
  DATA_INICIO: string;
  DATA_FIM: string | null;
}

export class ClassAccessMapper {
  static fromPersistence(row: ClassAccessPersistenceRow): ClassAccess {
    return {
      id: row.ID,
      userId: row.USUARIO_ID,
      userName: formatPersonName(row.NOME_USUARIO),
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      reason: row.MOTIVO,
      justification: row.JUSTIFICATIVA,
      grantedById: row.CONCEDIDO_POR,
      grantedByName: formatPersonName(row.NOME_CONCEDENTE),
      startDate: row.DATA_INICIO,
      endDate: row.DATA_FIM,
    };
  }

  static toOutput(access: ClassAccess): ClassAccessOutput {
    return { ...access };
  }
}
