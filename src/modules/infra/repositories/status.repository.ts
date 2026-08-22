import { PostgresDatabase } from '@shared/infra/database/index.js';
import { DependencyStatus } from '../../domain/entities/status.js';
import { IStatusRepository } from '../../domain/repositories/i-status-repository.js';

export class StatusRepository implements IStatusRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async checkDatabase(): Promise<DependencyStatus> {
    const startedAt = process.hrtime.bigint();

    try {
      await this.db.ping();
      return { name: 'postgres', state: 'up', latencyMs: elapsedMs(startedAt) };
    } catch (error) {
      return {
        name: 'postgres',
        state: 'down',
        latencyMs: elapsedMs(startedAt),
        detail: (error as Error).message,
      };
    }
  }
}

const elapsedMs = (startedAt: bigint): number =>
  Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
