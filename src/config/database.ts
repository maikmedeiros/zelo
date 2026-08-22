import { MongoDatabase, PostgresDatabase } from '@shared/infra/database/index.js';
import { env } from './env.js';

export const db = {
  core: new PostgresDatabase(
    {
      host: env.pg.host,
      port: env.pg.port,
      user: env.pg.user,
      password: env.pg.password,
      database: env.pg.database,
      max: env.pg.poolMax,
      ssl: env.pg.ssl ? { rejectUnauthorized: false } : undefined,
    },
    { logStatements: env.pg.logStatements },
  ),

  mongo: new MongoDatabase({ uri: env.mongo.uri, database: env.mongo.database }),
};
