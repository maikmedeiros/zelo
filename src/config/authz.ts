import { createAuth } from '@shared/auth/index.js';
import { ActorRepository } from '@modules/infra/repositories/actor.repository.js';
import { db } from './database.js';
import { env } from './env.js';

const authz = createAuth(new ActorRepository(db.core, env.session.idleDays), {
  cookieName: env.session.cookieName,
  cookieDomain: env.session.cookieDomain,
  apiTokenPrefix: env.apiToken.prefix,
  secureCookie: env.nodeEnv !== 'development',
  groups: true,
});

export default authz;
