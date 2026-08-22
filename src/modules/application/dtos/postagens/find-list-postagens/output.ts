import { Pagination } from '@shared/presenters/index.js';

export interface PostagemItemOutput {
  id: string;
  turma: { id: string; nome: string };
  autor: { handle: string; nome: string; perfil: string };
  titulo: string;
  texto: string;
  totalMidias: number;
  totalAlunosMarcados: number;
  publicadaEm: string;
}

/** O use-case entrega DADO, não envelope: `items` + `pagination`. O `results` é do controller. */
export interface FindListPostagensResult {
  items: PostagemItemOutput[];
  pagination: Pagination;
}
