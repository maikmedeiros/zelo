export interface TurmaVisivel {
  id: string;
  nome: string;
}

export interface ITurmaRepository {
  /** Turmas visíveis a um `handle`: filhos matriculados (responsável) ou atribuição (professor). */
  listVisiveisPara(handle: string): Promise<TurmaVisivel[]>;
  /** `true` quando a turma existe e está ativa. */
  exists(id: string): Promise<boolean>;
}
