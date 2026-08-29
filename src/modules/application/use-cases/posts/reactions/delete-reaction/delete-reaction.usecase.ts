import { NotFoundError } from '@shared/errors/index.js';
import { IReactionRepository } from '../../../../../domain/repositories/i-reaction-repository.js';

export class DeleteReactionUseCase {
  constructor(private readonly reactionRepo: IReactionRepository) {}

  async execute(postId: string, actorId: string): Promise<void> {
    // Sem checagem de audiência: a única linha que este DELETE alcança é a do próprio ator,
    // e quem não reagiu não tem o que remover. Ler a postagem antes seria trabalho para
    // chegar à mesma resposta.
    const removeu = await this.reactionRepo.remove(postId, actorId);
    if (!removeu) throw new NotFoundError({ message: 'Você não reagiu a esta postagem' });
  }
}
