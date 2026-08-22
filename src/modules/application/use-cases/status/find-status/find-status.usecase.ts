import { ServiceStatus } from '../../../../domain/entities/status.js';
import { IStatusRepository } from '../../../../domain/repositories/i-status-repository.js';
import { FindStatusResult } from '../../../dtos/status/find-status/output.js';
import { StatusMapper } from '../../../mappers/status/status-mapper.js';

export interface FindStatusUseCaseParams {
  service: string;
  version: string;
  environment: string;
}

export class FindStatusUseCase {
  constructor(
    private readonly statusRepo: IStatusRepository,
    private readonly params: FindStatusUseCaseParams,
  ) {}

  async execute(): Promise<FindStatusResult> {
    const status: ServiceStatus = {
      service: this.params.service,
      version: this.params.version,
      environment: this.params.environment,
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: [await this.statusRepo.checkDatabase()],
    };

    return StatusMapper.toOutput(status);
  }
}
