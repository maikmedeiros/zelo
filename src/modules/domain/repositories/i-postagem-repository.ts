import { Pagination } from '@shared/presenters/index.js';
import { Postagem, PostagemCriada, PostagemDetalhe } from '../entities/postagem.js';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ListPostagensFilters {
  turmaIds?: string[];
  alunoId?: string;
  publicadaDe?: string;
  publicadaAte?: string;
  audienciaHandle?: string;
}

export interface ListPostagensResult {
  data: Postagem[];
  pagination: Pagination;
}

export interface MidiaParaCriar {
  caminho: string;
  tipo: string;
  tamanhoBytes: number;
  hashConteudo: string;
}

export interface CreatePostagemData {
  turmaId: string;
  titulo: string;
  texto: string;
  criadoPor: string;
}

export interface IPostagemRepository {
  list(filters: ListPostagensFilters, pagination: PaginationParams): Promise<ListPostagensResult>;
  findById(id: string, audienciaHandle?: string): Promise<PostagemDetalhe | null>;
  create(data: CreatePostagemData): Promise<PostagemCriada>;
  marcarAlunos(postagemId: string, alunoIds: string[], criadoPor: string): Promise<void>;
  anexarMidias(postagemId: string, midias: MidiaParaCriar[], criadoPor: string): Promise<void>;
  findAutorHandle(id: string): Promise<string | null>;
  delete(id: string, removidoPor: string): Promise<boolean>;
}
