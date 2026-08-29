import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { hashPassword } from '@shared/utils/password/index.js';
import { UserAccount } from '../../../../domain/entities/user.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export interface UpdateUserInputData {
  email?: string;
  password?: string;
  active?: boolean;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(userId: string, data: UpdateUserInputData, actorId: string): Promise<UserAccount> {
    const atual = await this.userRepo.findById(userId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Usuário não encontrado' });

    if (data.active === false && userId === actorId) {
      throw new UnprocessableEntityError({
        message: 'Não é possível desativar o próprio usuário',
      });
    }

    const passwordHash = data.password ? await hashPassword(data.password) : undefined;

    // Trocar a credencial e deixar de pé a sessão aberta com a credencial antiga não muda
    // nada para quem já estava dentro. As duas coisas andam juntas, na mesma transação.
    const alterado = await this.db.transaction(async () => {
      const ok = await this.userRepo.update(userId, {
        email: data.email,
        passwordHash,
        active: data.active,
      });

      if (ok && (passwordHash !== undefined || data.active === false)) {
        await this.userRepo.revokeAccess(userId, actorId);
      }

      return ok;
    });

    // Já existe (o findById passou), então zero linhas aqui é colisão de `uq_usuario_email`.
    if (!alterado) {
      const existing = data.email ? await this.userRepo.findIdByEmail(data.email) : null;

      throw new ConflictError({
        message: 'Este e-mail já está em uso',
        cause: { email: data.email, userId: existing },
      });
    }

    const user = await this.userRepo.findById(userId, actorId, null);
    if (!user) throw new InternalServerError({ message: 'Usuário alterado mas não relido' });

    return user;
  }
}
