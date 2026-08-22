import { createApp } from '@main/app.js';
import { db } from '@config/database.js';
import { env } from '@config/env.js';
import { logger } from '@shared/utils/logger/index.js';

// Conecta ANTES do listen para as primeiras requisições já encontrarem o pool pronto.
// Falhar NÃO impede a API de subir: log de requisição é acessório, não requisito.
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

// Encerramento ordenado: para de aceitar conexão nova, drena as em curso e fecha os pools.
// Sem isso, um deploy derruba requisição no meio e deixa transação abortando no banco.
const shutdown = (signal: string): void => {
  logger.info(`Recebido ${signal}, encerrando`);

  server.close(async () => {
    await Promise.allSettled([db.core.close(), db.mongo.close()]);
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
