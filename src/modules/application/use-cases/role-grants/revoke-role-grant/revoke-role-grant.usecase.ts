import { ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IRoleGrantRepository } from '../../../../domain/repositories/i-role-grant-repository.js';

export class RevokeRoleGrantUseCase {
  constructor(private readonly grantRepo: IRoleGrantRepository) {}

  async execute(grantId: string, actorId: string): Promise<void> {
    const grant = await this.grantRepo.findById(grantId, actorId);
    if (!grant) throw new NotFoundError({ message: 'Concessão não encontrada' });

    // Revogar o próprio perfil é o jeito mais fácil de o operador se trancar do lado de fora
    // — e, diferente da desativação de usuário, sem ninguém para reabrir se ele era o único.
    if (grant.userId === actorId) {
      throw new UnprocessableEntityError({
        message: 'Não é possível revogar o próprio perfil',
        cause: { roleCode: grant.roleCode },
      });
    }

    // Encerrar, não apagar: a concessão passada explica o que aquele usuário podia fazer na
    // data em que fez.
    const encerrada = await this.grantRepo.revoke(grantId);
    if (!encerrada) {
      throw new ConflictError({
        message: 'Concessão já encerrada',
        cause: { endDate: grant.endDate },
      });
    }
  }
}
