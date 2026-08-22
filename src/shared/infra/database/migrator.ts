import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { logger } from '@shared/utils/logger/index.js';

export interface MigrationConnection extends pg.ClientConfig {
  database: string;
}

// `src/shared/infra/database/` e `dist/shared/infra/database/` ficam à mesma distância da
// raiz do projeto, então o mesmo caminho relativo vale para o tsx e para o build.
const MIGRATIONS_DIR = fileURLToPath(new URL('../../../../db/migrations/', import.meta.url));

// Trava exclusiva do processo de migration. O número é arbitrário — só precisa ser o mesmo
// em toda instância, para que duas subindo juntas não apliquem o mesmo arquivo em paralelo.
const ADVISORY_LOCK_KEY = 4020260;

const PG_INVALID_CATALOG_NAME = '3D000';

const CREATE_CONTROL_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migration (
    versao      text PRIMARY KEY,
    checksum    text NOT NULL,
    aplicado_em timestamptz NOT NULL DEFAULT now()
  );
`;

interface MigrationFile {
  versao: string;
  sql: string;
  checksum: string;
}

const errorCode = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;

const databaseExists = async (connection: MigrationConnection): Promise<boolean> => {
  const probe = new pg.Client(connection);

  try {
    await probe.connect();
  } catch (error) {
    if (errorCode(error) === PG_INVALID_CATALOG_NAME) return false;
    throw error;
  }

  await probe.end();
  return true;
};

const createDatabase = async (connection: MigrationConnection): Promise<void> => {
  // CREATE DATABASE não aceita parâmetro, não roda dentro de transação e não pode partir de
  // uma conexão ao próprio banco-alvo — daí o cliente separado no banco de manutenção. O
  // nome é o único trecho interpolado em todo o projeto, e vai escapado como identificador.
  const admin = new pg.Client({ ...connection, database: 'postgres' });
  await admin.connect();

  try {
    await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(connection.database)}`);
    logger.info(`Banco ${connection.database} criado`);
  } catch (error) {
    // Duas instâncias subindo juntas: conforme o instante em que a outra commita, o
    // PostgreSQL devolve `42P04` OU a violação crua do índice de pg_database. Catalogar
    // códigos aqui é jogo perdido — a pergunta que importa é uma só: o banco está lá?
    if (!(await databaseExists(connection))) throw error;
    logger.info(`Banco ${connection.database} já havia sido criado por outra instância`);
  } finally {
    await admin.end();
  }
};

const readMigrations = async (): Promise<MigrationFile[]> => {
  /* eslint-disable security/detect-non-literal-fs-filename */
  const entries = await readdir(MIGRATIONS_DIR);
  const arquivos = entries.filter((nome) => nome.endsWith('.sql')).sort();

  return Promise.all(
    arquivos.map(async (versao) => {
      const sql = await readFile(join(MIGRATIONS_DIR, versao), 'utf8');
      return { versao, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    }),
  );
  /* eslint-enable security/detect-non-literal-fs-filename */
};

// Banco com tabelas mas sem histórico de migration: ou é um esquema anterior ao migrator,
// ou o migrator está apontado para o banco errado. Aplicar a 001 em cima disso falharia com
// um `already exists` cru, que não diz nada sobre a causa.
const assertBancoVazio = async (client: pg.Client): Promise<void> => {
  const { rows } = await client.query<{ total: string }>(
    "SELECT count(*)::text AS total FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'schema_migration';",
  );

  if (rows[0]?.total === '0') return;

  throw new Error(
    `O banco já tem ${rows[0]?.total} tabela(s) mas nenhuma migration registrada. ` +
      'Se for um esquema antigo, recrie o banco (`npm run db:reset` no ambiente local). ' +
      'Se o esquema já estiver correto, registre as versões em schema_migration antes de subir.',
  );
};

const applyPending = async (client: pg.Client, migrations: MigrationFile[]): Promise<number> => {
  const { rows } = await client.query<{ versao: string; checksum: string }>(
    'SELECT versao, checksum FROM schema_migration;',
  );
  const aplicadas = new Map(rows.map((row) => [row.versao, row.checksum]));

  if (aplicadas.size === 0) await assertBancoVazio(client);

  let total = 0;

  for (const migration of migrations) {
    const checksum = aplicadas.get(migration.versao);
    if (checksum === migration.checksum) continue;

    if (checksum !== undefined) {
      // Editar migration já aplicada faz os ambientes divergirem em silêncio: banco novo
      // recebe o arquivo corrigido, banco antigo fica com a versão velha e ninguém percebe.
      throw new Error(
        `Migration ${migration.versao} foi alterada depois de aplicada. ` +
          'Crie um arquivo novo em vez de editar o que já rodou.',
      );
    }

    await client.query('BEGIN;');
    try {
      // O arquivo vai inteiro numa única chamada: quebrar por `;` partiria os blocos
      // `DO $$ ... $$` ao meio.
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migration (versao, checksum) VALUES ($1, $2);', [
        migration.versao,
        migration.checksum,
      ]);
      await client.query('COMMIT;');
    } catch (error) {
      await client.query('ROLLBACK;').catch(() => undefined);
      throw new Error(`Falha ao aplicar a migration ${migration.versao}`, { cause: error });
    }

    logger.info(`Migration aplicada: ${migration.versao}`);
    total += 1;
  }

  return total;
};

export const runMigrations = async (connection: MigrationConnection): Promise<void> => {
  if (!(await databaseExists(connection))) {
    await createDatabase(connection);
  }

  const migrations = await readMigrations();
  if (migrations.length === 0) {
    logger.warn(`Nenhuma migration encontrada em ${MIGRATIONS_DIR}`);
    return;
  }

  const client = new pg.Client(connection);
  await client.connect();

  try {
    // A trava vem ANTES do CREATE TABLE: duas instâncias criando a tabela de controle ao
    // mesmo tempo colidem no catálogo do PostgreSQL, e não há tabela para travar ainda.
    await client.query('SELECT pg_advisory_lock($1);', [ADVISORY_LOCK_KEY]);
    await client.query(CREATE_CONTROL_TABLE);

    const total = await applyPending(client, migrations);
    if (total === 0) logger.info('Banco já está na última migration');
  } finally {
    // Encerrar a sessão devolve a trava — não há unlock explícito a esquecer no caminho de erro.
    await client.end();
  }
};
