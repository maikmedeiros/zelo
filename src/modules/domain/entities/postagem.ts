/** Aluno marcado numa postagem — habilita o relatório individual e o filtro por criança. */
export interface AlunoMarcado {
  id: string;
  nome: string;
}

export interface MidiaPostagem {
  id: string;
  /** Caminho RELATIVO no storage. A URL pública é montada no mapper. */
  caminho: string;
  tipo: string;
  /** Variante com faces borradas, quando existe (Fase 2 — visão computacional). */
  caminhoVariante: string | null;
}

export interface TurmaResumo {
  id: string;
  nome: string;
}

export interface AutorResumo {
  handle: string;
  nome: string;
  perfil: string;
}

/** Read model da LISTA do feed. */
export interface Postagem {
  id: string;
  turma: TurmaResumo;
  autor: AutorResumo;
  titulo: string;
  texto: string;
  totalMidias: number;
  totalAlunosMarcados: number;
  publicadaEm: string;
}

/** Read model do DETALHE — formato diferente, entity própria (cuidado com colisão de nome). */
export interface PostagemDetalhe {
  id: string;
  turma: TurmaResumo;
  autor: AutorResumo;
  titulo: string;
  texto: string;
  midias: MidiaPostagem[];
  alunosMarcados: AlunoMarcado[];
  publicadaEm: string;
  atualizadaEm: string | null;
}

/** Retorno da criação: a proc/`RETURNING` reprojeta a linha criada. */
export interface PostagemCriada {
  id: string;
  turmaId: string;
  titulo: string;
  publicadaEm: string;
}
