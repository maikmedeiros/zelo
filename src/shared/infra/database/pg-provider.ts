import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { logger } from '@shared/utils/logger/index.js';
import { redact } from '@shared/utils/request-log/index.js';

export interface PostgresDatabaseOptions {
  logStatements?: boolean; // opt-in por instância; quem liga é config/database.ts
}

/**
 * Provider de PostgreSQL sem ORM: SQL cru escrito à mão dentro dos repositórios.
 *
 * A sentença usa parâmetros NOMEADOS (`@nome`), traduzidos aqui para os posicionais do
 * `pg` (`$1`, `$2`). Isso mantém o SQL do repositório legível e — mais importante — torna
 * impossível montar a query por concatenação de valor, que é o que mantém o
 * `p/sql-injection` do Semgrep limpo.
 */
export class PostgresDatabase implements IDatabaseTransaction {
  private pool: pg.Pool | null = null;
  private readonly ongoingTransaction = new AsyncLocalStorage<pg.PoolClient>();

  constructor(
    private readonly config: pg.PoolConfig,
    private readonly options: PostgresDatabaseOptions = {},
  ) {}

  // UM Pool por instância, reutilizado. O `pg.Pool` já é lazy e serializa a criação de
  // conexões internamente, então não há a corrida que o driver do SQL Server tem.
  private getPool(): pg.Pool {
    if (!this.pool) {
      this.pool = new pg.Pool(this.config);
      // Erro em conexão OCIOSA chega por evento; sem listener o Node derruba o processo.
      this.pool.on('error', (err) => logger.error({ err }, 'Erro em conexão ociosa do PostgreSQL'));
    }
    return this.pool;
  }

  // Um único log, emitido DEPOIS do resultado: imprimir o cabeçalho antes do `await`
  // intercalaria os blocos de queries concorrentes.
  private logStatement(
    sql: string,
    variables: Record<string, unknown> | undefined,
    startedAt: bigint,
    outcome: string,
  ): void {
    if (!this.options.logStatements) return;

    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const lines = ['──────── SQL ────────', sql.trim()];

    // A sentença é texto do próprio código, mas os params carregam dado do request — daí o redact.
    if (variables && Object.keys(variables).length > 0) {
      lines.push(`params: ${JSON.stringify(redact(variables))}`);
    }
    lines.push(`${outcome} | ${elapsedMs.toFixed(1)}ms`, '─────────────────────');

    logger.debug(`\n${lines.join('\n')}`);
  }

  /**
   * `@nome` → `$n`, na ordem da primeira ocorrência. Um mesmo `@nome` repetido reaproveita
   * o mesmo `$n`. Nome declarado no SQL e ausente no objeto é erro de programação: falha
   * alto em vez de mandar `undefined` para o banco.
   */
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
      return result.rows as T[]; // devolve SÓ as linhas
    } catch (error) {
      // Loga e relança: o tratamento continua sendo do error handler global.
      this.logStatement(sql, variables, startedAt, `erro: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Toda query do `work` entra nesta transação sem recebê-la por parâmetro — é o que permite
   * um use-case agrupar escritas de repositórios diferentes numa transação só, sem que o
   * domínio conheça o driver. Como a transação usa UMA conexão, as queries do `work` têm de
   * ser SEQUENCIAIS: duas em paralelo se atropelam no mesmo client.
   */
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.ongoingTransaction.getStore()) return work(); // já dentro de uma: reentrante

    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await this.ongoingTransaction.run(client, work);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      // O rollback falhando não pode encobrir o erro original.
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  /** Usado pelo health check: confirma que o pool responde. */
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
