import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { RevokeSessionUseCase } from '@modules/application/use-cases/sessions/revoke-session/revoke-session.usecase.js';
import { SessionRepository } from '@modules/infra/repositories/session.repository.js';
import { RevokeSessionController } from '@modules/presentation/controllers/sessions/revoke-session/revoke-session.controller.js';

export const makeRevokeSessionController = (): RevokeSessionController => {
  const sessionRepo = new SessionRepository(db.core, {
    idleDays: env.session.idleDays,
    maxDays: env.session.maxDays,
  });

  return new RevokeSessionController(
    new RevokeSessionUseCase(sessionRepo),
    authz.sessionCookie,
    env.session.cookieName,
  );
};
