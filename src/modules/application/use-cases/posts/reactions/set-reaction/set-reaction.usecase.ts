import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { ReactionSummary } from '../../../../../domain/entities/reaction.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { IReactionRepository } from '../../../../../domain/repositories/i-reaction-repository.js';

export class SetReactionUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly reactionRepo: IReactionRepository,
  ) {}

  async execute(
    postId: string,
    actorId: string,
    viewerId: string | null,
    code: string,
  ): Promise<ReactionSummary> {
    // Reagir é ato de leitor, como comentar: o alcance vem do `findById`, não do guard de
    // dono. Quem recebeu a postagem reage a ela.
    const post = await this.postRepo.findById(postId, viewerId, actorId);
    if (!post) throw new NotFoundError({ message: 'Postagem não encontrada' });

    if (post.publishedAt === null) {
      throw new UnprocessableEntityError({ message: 'Só postagem publicada aceita reação' });
    }

    const gravou = await this.reactionRepo.set(postId, actorId, code);

    // Zero linhas com a postagem já validada só pode ser código fora do catálogo — ou um
    // aposentado, que não aceita reação nova mas preserva as antigas.
    if (!gravou) {
      const disponiveis = await this.reactionRepo.listTypes();

      throw new UnprocessableEntityError({
        message: `Reação desconhecida: ${code}`,
        cause: { aceitos: disponiveis.map((tipo) => tipo.code) },
      });
    }

    return this.reactionRepo.summary(postId, actorId);
  }
}
