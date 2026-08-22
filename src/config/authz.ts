import { createAuth } from '@shared/auth/index.js';
import { ActorRepository } from '@modules/infra/repositories/actor.repository.js';
import { db } from './database.js';
import { env } from './env.js';

const authz = createAuth(new ActorRepository(db.core), {
  cookieName: env.session.cookieName,
  cookieDomain: env.session.cookieDomain,
  apiKeyPrefix: env.apiKey.prefix,
  secureCookie: env.nodeEnv !== 'development',
});

export default authz;
