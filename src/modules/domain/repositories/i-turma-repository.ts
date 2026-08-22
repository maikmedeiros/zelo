export interface TurmaVisivel {
  id: string;
  nome: string;
}

export interface ITurmaRepository {
  listVisiveisPara(handle: string): Promise<TurmaVisivel[]>;
  exists(id: string): Promise<boolean>;
}
