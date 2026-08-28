import { PostgresDatabase } from '@shared/infra/database/index.js';
import { SessionValidity } from '../../domain/entities/session.js';
import {
  CreateSessionData,
  ISessionRepository,
} from '../../domain/repositories/i-session-repository.js';
import { SessionValidityPersistenceRow } from '../../application/mappers/sessions/session-mapper.js';

const INSERT_SESSION = `
  INSERT INTO sessao (usuario_id, token_hash, ip, user_agent, expira_em, expira_absoluto_em)
  VALUES (
    @userId::uuid,
    @tokenHash,
    @ip::inet,
    @userAgent,
    now() + @idleWindow::interval,
    now() + @maxWindow::interval
  )
  RETURNING
    expira_em          AS "EXPIRA_EM",
    expira_absoluto_em AS "EXPIRA_ABSOLUTO_EM";
`;

const DELETE_SESSION = `
  DELETE FROM sessao WHERE token_hash = @tokenHash RETURNING id;
`;

export class SessionRepository implements ISessionRepository {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly windows: { idleDays: number; maxDays: number },
  ) {}

  async create(data: CreateSessionData): Promise<SessionValidity> {
    const rows = await this.db.query<SessionValidityPersistenceRow>(INSERT_SESSION, {
      ...data,
      idleWindow: `${this.windows.idleDays} days`,
      maxWindow: `${this.windows.maxDays} days`,
    });

    const created = rows[0]!;
    return { expiresAt: created.EXPIRA_EM, absoluteExpiresAt: created.EXPIRA_ABSOLUTO_EM };
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(DELETE_SESSION, { tokenHash });
    return rows.length > 0;
  }
}
