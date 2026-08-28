import { UnauthorizedError } from '@shared/errors/index.js';
import { AuthenticatedUser } from '../../../../domain/entities/user.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export class FindCurrentSessionUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepo.findAuthenticatedById(userId);
    if (!user) throw new UnauthorizedError();

    return user;
  }
}
