import { ReactionType } from '../../../../domain/entities/reaction.js';
import { IReactionRepository } from '../../../../domain/repositories/i-reaction-repository.js';

/**
 * O catálogo inteiro, sem recorte: os três emojis são iguais para toda a escola, e esconder
 * um deles de alguém não protege nada. É a única leitura da Fase 4 sem filtro de audiência.
 */
export class FindListReactionTypesUseCase {
  constructor(private readonly reactionRepo: IReactionRepository) {}

  async execute(): Promise<ReactionType[]> {
    return this.reactionRepo.listTypes();
  }
}
