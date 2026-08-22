import { DependencyStatus } from '../entities/status.js';

export interface IStatusRepository {
  /** Nunca lança: indisponibilidade de dependência é DADO do status, não erro da rota. */
  checkDatabase(): Promise<DependencyStatus>;
}
