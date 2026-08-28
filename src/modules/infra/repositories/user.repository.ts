import { PostgresDatabase } from '@shared/infra/database/index.js';
import { AuthenticatedUser, UserCredentials } from '../../domain/entities/user.js';
import { IUserRepository } from '../../domain/repositories/i-user-repository.js';
import {
  AuthenticatedUserPersistenceRow,
  CredentialsPersistenceRow,
  SessionMapper,
} from '../../application/mappers/sessions/session-mapper.js';

const SELECT_CREDENTIALS = `
  SELECT
    u.id::text    AS "ID",
    p.nome        AS "NOME",
    u.email::text AS "EMAIL",
    u.senha_hash  AS "SENHA_HASH"
  FROM usuario u
  INNER JOIN pessoa p ON p.id = u.pessoa_id
  WHERE u.email = @email
    AND u.ativo = true;
`;

const SELECT_AUTHENTICATED = `
  SELECT
    u.id::text    AS "ID",
    p.nome        AS "NOME",
    u.email::text AS "EMAIL",
    f.codigo      AS "PERFIL"
  FROM usuario u
  INNER JOIN pessoa p ON p.id = u.pessoa_id
  LEFT JOIN usuario_perfil up
    ON up.usuario_id = u.id
   AND up.data_inicio <= CURRENT_DATE
   AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
  LEFT JOIN perfil f ON f.id = up.perfil_id
  WHERE u.id = @userId::uuid
    AND u.ativo = true;
`;

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const rows = await this.db.query<CredentialsPersistenceRow>(SELECT_CREDENTIALS, { email });
    const first = rows[0];
    return first ? SessionMapper.credentialsFromPersistence(first) : null;
  }

  async findAuthenticatedById(userId: string): Promise<AuthenticatedUser | null> {
    const rows = await this.db.query<AuthenticatedUserPersistenceRow>(SELECT_AUTHENTICATED, {
      userId,
    });
    return SessionMapper.authenticatedFromPersistence(rows);
  }
}
