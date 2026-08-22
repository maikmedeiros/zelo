import { MongoDatabase, PostgresDatabase } from '@shared/infra/database/index.js';
import { env } from './env.js';

// Uma única definição de conexão serve ao pool da aplicação e ao migrator: separá-las é
// como o app acaba migrando um banco e consultando outro.
export const pgConnection = {
  host: env.pg.host,
  port: env.pg.port,
  user: env.pg.user,
  password: env.pg.password,
  database: env.pg.database,
  ssl: env.pg.ssl ? { rejectUnauthorized: false } : undefined,
};

export const db = {
  core: new PostgresDatabase(
    { ...pgConnection, max: env.pg.poolMax },
    { logStatements: env.pg.logStatements },
  ),

  mongo: new MongoDatabase({ uri: env.mongo.uri, database: env.mongo.database }),
};
