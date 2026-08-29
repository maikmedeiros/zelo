/** O catálogo: é tabela, não enum, porque a interface precisa do emoji e do rótulo. */
export interface ReactionType {
  code: string;
  /** Texto que o leitor de tela anuncia — emoji sozinho é lido de forma inconsistente. */
  label: string;
  emoji: string;
  order: number;
}

export interface ReactionTally extends ReactionType {
  count: number;
}

/**
 * O que o feed precisa de uma postagem: quantas de cada, e qual é a minha.
 *
 * Não é lista de reações. Devolver quem reagiu com o quê entregaria a cada família o
 * comportamento das outras dentro da turma — e ninguém precisa disso para desenhar a barra
 * de emojis. A contagem sai de um GROUP BY; não há coluna de contador, que divergiria.
 */
export interface ReactionSummary {
  postId: string;
  total: number;
  tallies: ReactionTally[];
  /** O código da reação do próprio ator, ou `null` se ele ainda não reagiu. */
  mine: string | null;
}
