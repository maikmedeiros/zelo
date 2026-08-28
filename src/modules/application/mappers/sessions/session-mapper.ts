import { AuthenticatedUser } from '../../../domain/entities/user.js';

export interface CredentialsPersistenceRow {
  ID: string;
  NOME: string;
  EMAIL: string;
  SENHA_HASH: string;
}

export interface AuthenticatedUserPersistenceRow {
  ID: string;
  NOME: string;
  EMAIL: string;
  PERFIL: string | null;
}

export interface SessionValidityPersistenceRow {
  EXPIRA_EM: Date;
  EXPIRA_ABSOLUTO_EM: Date;
}

export interface IdentityOutput {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface CurrentSessionOutput extends IdentityOutput {
  permissions: string[];
  classes: string[];
}

export class SessionMapper {
  static credentialsFromPersistence(row: CredentialsPersistenceRow) {
    return {
      id: row.ID,
      name: row.NOME,
      email: row.EMAIL,
      passwordHash: row.SENHA_HASH,
    };
  }

  static authenticatedFromPersistence(rows: AuthenticatedUserPersistenceRow[]) {
    const first = rows[0];
    if (!first) return null;

    return {
      id: first.ID,
      name: first.NOME,
      email: first.EMAIL,
      roles: rows.map((row) => row.PERFIL).filter((role): role is string => role !== null),
    };
  }

  static toIdentity(user: AuthenticatedUser): IdentityOutput {
    return { id: user.id, name: user.name, email: user.email, roles: user.roles };
  }

  static toCurrentSession(
    user: AuthenticatedUser,
    permissions: string[],
    classes: string[],
  ): CurrentSessionOutput {
    return { ...SessionMapper.toIdentity(user), permissions, classes };
  }
}
