import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { logger } from '@shared/utils/logger/index.js';
import { redact } from '@shared/utils/request-log/index.js';

export interface PostgresDatabaseOptions {
  logStatements?: boolean;
}

export class PostgresDatabase implements IDatabaseTransaction {
  private pool: pg.Pool | null = null;
  private readonly ongoingTransaction = new AsyncLocalStorage<pg.PoolClient>();

  constructor(
    private readonly config: pg.PoolConfig,
    private readonly options: PostgresDatabaseOptions = {},
  ) {}

  private getPool(): pg.Pool {
    if (!this.pool) {
      this.pool = new pg.Pool(this.config);
      this.pool.on('error', (err) => logger.error({ err }, 'Erro em conexão ociosa do PostgreSQL'));
    }
    return this.pool;
  }

  private logStatement(
    sql: string,
    variables: Record<string, unknown> | undefined,
    startedAt: bigint,
    outcome: string,
  ): void {
    if (!this.options.logStatements) return;

    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const lines = ['──────── SQL ────────', sql.trim()];

    if (variables && Object.keys(variables).length > 0) {
      lines.push(`params: ${JSON.stringify(redact(variables))}`);
    }
    lines.push(`${outcome} | ${elapsedMs.toFixed(1)}ms`, '─────────────────────');

    logger.debug(`\n${lines.join('\n')}`);
  }

  private bindNamedParameters(
    sql: string,
    variables: Record<string, unknown> = {},
  ): { text: string; values: unknown[] } {
    const values: unknown[] = [];
    const positionByName = new Map<string, number>();

    const text = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name: string) => {
      const existing = positionByName.get(name);
      if (existing !== undefined) return `$${existing}`;

      if (!Object.prototype.hasOwnProperty.call(variables, name)) {
        throw new Error(`Parâmetro @${name} usado no SQL mas não informado`);
      }

      values.push(variables[name]);
      const position = values.length;
      positionByName.set(name, position);
      return `$${position}`;
    });

    return { text, values };
  }

  async query<T = unknown>(sql: string, variables?: Record<string, unknown>): Promise<T[]> {
    const { text, values } = this.bindNamedParameters(sql, variables);
    const executor = this.ongoingTransaction.getStore() ?? this.getPool();

    const startedAt = process.hrtime.bigint();
    try {
      const result = await executor.query<T extends pg.QueryResultRow ? T : never>(text, values);
      this.logStatement(sql, variables, startedAt, `rows: ${result.rowCount ?? 0}`);
      return result.rows as T[];
    } catch (error) {
      this.logStatement(sql, variables, startedAt, `erro: ${(error as Error).message}`);
      throw error;
    }
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.ongoingTransaction.getStore()) return work();

    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await this.ongoingTransaction.run(client, work);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async ping(): Promise<void> {
    await this.query('SELECT 1;');
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
