import { ServiceStatus } from '../../../domain/entities/status.js';
import { FindStatusResult } from '../../dtos/status/find-status/output.js';

export class StatusMapper {
  static toOutput(status: ServiceStatus): FindStatusResult {
    const degraded = status.dependencies.some((dependency) => dependency.state === 'down');

    return {
      service: status.service,
      version: status.version,
      environment: status.environment,
      uptimeSeconds: status.uptimeSeconds,
      status: degraded ? 'degraded' : 'ok',
      dependencies: status.dependencies.map((dependency) => ({
        name: dependency.name,
        state: dependency.state,
        latencyMs: dependency.latencyMs,
        ...(dependency.detail ? { detail: dependency.detail } : {}),
      })),
    };
  }
}
