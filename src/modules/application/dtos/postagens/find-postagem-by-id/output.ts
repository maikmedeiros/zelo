export interface MidiaOutput {
  id: string;
  /** URL pública assinável — o caminho relativo do banco nunca sai da aplicação. */
  url: string;
  tipo: string;
  /** Variante com faces borradas, quando existe. */
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
