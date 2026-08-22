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
  /**
   * ISOLAMENTO DE AUDIÊNCIA. Quando presente, a consulta só devolve postagens de turmas
   * visíveis a este `handle` — turma de filho matriculado (responsável) ou turma atribuída
   * (professor). `undefined` só quando o ator tem a capability no escopo `:any`.
   */
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
  /** `handle` do autor — identificador estável, nunca o nome de exibição. */
  criadoPor: string;
}

export interface IPostagemRepository {
  list(filters: ListPostagensFilters, pagination: PaginationParams): Promise<ListPostagensResult>;
  /** `null` = não encontrada OU fora da audiência do `audienciaHandle`. */
  findById(id: string, audienciaHandle?: string): Promise<PostagemDetalhe | null>;
  create(data: CreatePostagemData): Promise<PostagemCriada>;
  /** Marca alunos numa postagem. Chamado dentro da transação da criação. */
  marcarAlunos(postagemId: string, alunoIds: string[], criadoPor: string): Promise<void>;
  anexarMidias(postagemId: string, midias: MidiaParaCriar[], criadoPor: string): Promise<void>;
  /** `null` = não encontrada. Devolve o `handle` do autor para a checagem de escopo `:own`. */
  findAutorHandle(id: string): Promise<string | null>;
  /** `false` = não encontrada (ou já removida). */
  delete(id: string, removidoPor: string): Promise<boolean>;
}
