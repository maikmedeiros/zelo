import { MongoDatabase, PostgresDatabase } from '@shared/infra/database/index.js';
import { env } from './env.js';

/**
 * A CLASSE do provider mora em `shared/infra/`; a INSTANCIAÇÃO mora aqui. Os repositórios
 * recebem o provider por constructor, injetado nas factories — nunca importam este módulo.
 *
 * Exportado como objeto para comportar mais de um banco sem quebrar quem já importa.
 */
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
    // Debug opt-in por COMANDO, não por código: o provider não lê o env, recebe a flag.
    { logStatements: env.pg.logStatements },
  ),

  mongo: new MongoDatabase({ uri: env.mongo.uri, database: env.mongo.database }),
};
