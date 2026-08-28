import { assertFeaturesInSync } from '@main/assert-features-in-sync.js';
import { createApp } from '@main/app.js';
import { db, pgConnection } from '@config/database.js';
import { env } from '@config/env.js';
import { runMigrations } from '@shared/infra/database/index.js';
import { logger } from '@shared/utils/logger/index.js';

// Antes de qualquer outra coisa: sem esquema não há aplicação. Falha aqui derruba o boot,
// no mesmo espírito da validação de env — nada de subir e quebrar na primeira query.
if (env.pg.autoMigrate) {
  await runMigrations(pgConnection);
}

// Depois das migrations, porque é a migration que insere as linhas de PERMISSAO.
await assertFeaturesInSync();

if (env.mongo.logEnabled) {
  try {
    await db.mongo.connect();
    logger.info('Log de requisições no MongoDB habilitado');
  } catch (err) {
    logger.error({ err }, 'Subindo o servidor sem o log de requisições no MongoDB');
  }
}

const app = await createApp();

const server = app.listen(env.port, () => {
  logger.info(`Server running on port: ${env.port}`);
});

const shutdown = (signal: string): void => {
  logger.info(`Recebido ${signal}, encerrando`);

  server.close(async () => {
    await Promise.allSettled([db.core.close(), db.mongo.close()]);
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
