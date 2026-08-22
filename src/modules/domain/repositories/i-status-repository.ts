import { DependencyStatus } from '../entities/status.js';

export interface IStatusRepository {
  checkDatabase(): Promise<DependencyStatus>;
}
