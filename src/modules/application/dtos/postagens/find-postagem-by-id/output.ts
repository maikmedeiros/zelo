export interface MidiaOutput {
  id: string;
  url: string;
  tipo: string;
  urlVariante: string | null;
}

export interface AlunoMarcadoOutput {
  id: string;
  nome: string;
}

export interface PostagemDetalheOutput {
  id: string;
  turma: { id: string; nome: string };
  autor: { handle: string; nome: string; perfil: string };
  titulo: string;
  texto: string;
  midias: MidiaOutput[];
  alunosMarcados: AlunoMarcadoOutput[];
  publicadaEm: string;
  atualizadaEm: string | null;
}
