import { ReactionSummary, ReactionType } from '../entities/reaction.js';

export interface IReactionRepository {
  listTypes(): Promise<ReactionType[]>;

  summary(postId: string, actorId: string): Promise<ReactionSummary>;

  /**
   * Cria ou troca a reação do ator. `false` quando o código não existe ou está aposentado —
   * o use-case traduz em 422.
   *
   * Trocar é `UPDATE` da linha existente, nunca linha nova: o índice
   * `uq_reacao_por_usuario` garante uma reação por pessoa e por postagem.
   */
  set(postId: string, actorId: string, code: string): Promise<boolean>;

  /** `false` quando o ator não tinha reagido. */
  remove(postId: string, actorId: string): Promise<boolean>;
}
