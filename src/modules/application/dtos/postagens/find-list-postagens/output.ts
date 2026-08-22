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

export interface FindListPostagensResult {
  items: PostagemItemOutput[];
  pagination: Pagination;
}
