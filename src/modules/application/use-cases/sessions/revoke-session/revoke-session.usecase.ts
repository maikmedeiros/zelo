import { ISessionRepository } from '../../../../domain/repositories/i-session-repository.js';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(tokenHash: string): Promise<void> {
    await this.sessionRepo.deleteByTokenHash(tokenHash);
  }
}
