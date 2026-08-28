import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { CreateSessionUseCase } from '@modules/application/use-cases/sessions/create-session/create-session.usecase.js';
import { FindCurrentSessionUseCase } from '@modules/application/use-cases/sessions/find-current-session/find-current-session.usecase.js';
import { SessionRepository } from '@modules/infra/repositories/session.repository.js';
import { UserRepository } from '@modules/infra/repositories/user.repository.js';
import { CreateSessionController } from '@modules/presentation/controllers/sessions/create-session/create-session.controller.js';

export const makeCreateSessionController = (): CreateSessionController => {
  const userRepo = new UserRepository(db.core);
  const sessionRepo = new SessionRepository(db.core, {
    idleDays: env.session.idleDays,
    maxDays: env.session.maxDays,
  });

  return new CreateSessionController(
    new CreateSessionUseCase(userRepo, sessionRepo),
    new FindCurrentSessionUseCase(userRepo),
    authz.sessionCookie,
  );
};
