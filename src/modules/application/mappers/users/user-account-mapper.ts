import { PaginatedRow } from '@shared/infra/database/index.js';
import { UserAccount } from '../../../domain/entities/user.js';

export interface UserAccountOutput {
  id: string;
  personId: string;
  personName: string;
  email: string;
  active: boolean;
  emailVerified: boolean;
  lastAccessAt: string | null;
  profiles: string[];
}

export interface UserAccountPersistenceRow extends PaginatedRow {
  ID: string;
  PESSOA_ID: string;
  NOME_PESSOA: string;
  EMAIL: string;
  ATIVO: boolean;
  EMAIL_VERIFICADO: boolean;
  ULTIMO_ACESSO_EM: Date | null;
  PERFIS: string[] | null;
}

export class UserAccountMapper {
  static fromPersistence(row: UserAccountPersistenceRow): UserAccount {
    return {
      id: row.ID,
      personId: row.PESSOA_ID,
      personName: row.NOME_PESSOA,
      email: row.EMAIL,
      active: row.ATIVO,
      emailVerified: row.EMAIL_VERIFICADO,
      lastAccessAt: row.ULTIMO_ACESSO_EM,
      profiles: row.PERFIS ?? [],
    };
  }

  static toOutput(user: UserAccount): UserAccountOutput {
    return { ...user, lastAccessAt: user.lastAccessAt?.toISOString() ?? null };
  }
}
