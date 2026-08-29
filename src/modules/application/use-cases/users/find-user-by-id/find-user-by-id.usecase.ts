import { NotFoundError } from '@shared/errors/index.js';
import { UserAccount } from '../../../../domain/entities/user.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export class FindUserByIdUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, actorId: string, viewerId: string | null): Promise<UserAccount> {
    const user = await this.userRepo.findById(userId, actorId, viewerId);
    if (!user) throw new NotFoundError({ message: 'Usuário não encontrado' });

    return user;
  }
}
