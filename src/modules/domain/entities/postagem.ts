export interface AlunoMarcado {
  id: string;
  nome: string;
}

export interface MidiaPostagem {
  id: string;
  caminho: string;
  tipo: string;
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

export interface PostagemCriada {
  id: string;
  turmaId: string;
  titulo: string;
  publicadaEm: string;
}
