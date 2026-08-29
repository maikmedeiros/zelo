import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Guardian } from '../../../domain/entities/guardian.js';

export interface GuardianOutput {
  id: string;
  personId: string;
  personName: string;
  cpf: string | null;
  phone: string | null;
  contactEmail: string | null;
  receiveEmail: boolean;
  receivePush: boolean;
  studentCount: number;
}

export interface GuardianPersistenceRow extends PaginatedRow {
  ID: string;
  PESSOA_ID: string;
  NOME_PESSOA: string;
  CPF: string | null;
  TELEFONE: string | null;
  EMAIL_CONTATO: string | null;
  RECEBER_EMAIL: boolean;
  RECEBER_PUSH: boolean;
  TOTAL_ALUNO: number;
}

export class GuardianMapper {
  static fromPersistence(row: GuardianPersistenceRow): Guardian {
    return {
      id: row.ID,
      personId: row.PESSOA_ID,
      personName: formatPersonName(row.NOME_PESSOA),
      cpf: row.CPF,
      phone: row.TELEFONE,
      contactEmail: row.EMAIL_CONTATO,
      receiveEmail: row.RECEBER_EMAIL,
      receivePush: row.RECEBER_PUSH,
      studentCount: Number(row.TOTAL_ALUNO),
    };
  }

  static toOutput(guardian: Guardian): GuardianOutput {
    return { ...guardian };
  }
}
