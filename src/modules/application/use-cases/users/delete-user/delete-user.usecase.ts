import {
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { IUserRepository } from '../../../../domain/repositories/i-user-repository.js';

export class DeleteUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(userId: string, actorId: string): Promise<void> {
    const user = await this.userRepo.findById(userId, actorId, null);
    if (!user) throw new NotFoundError({ message: 'Usuário não encontrado' });

    if (userId === actorId) {
      throw new UnprocessableEntityError({ message: 'Não é possível desativar o próprio usuário' });
    }

    // Desativação, não remoção física: `postagem.autor_id`, `consentimento.registrado_por` e
    // `acesso_turma.concedido_por` referenciam `usuario` com ON DELETE RESTRICT. Apagar a
    // linha exigiria apagar o histórico junto, e o histórico é o que dá valor ao registro.
    await this.db.transaction(async () => {
      const ok = await this.userRepo.update(userId, { active: false });
      if (!ok) throw new InternalServerError({ message: 'Usuário não pôde ser desativado' });

      await this.userRepo.revokeAccess(userId, actorId);
    });
  }
}
