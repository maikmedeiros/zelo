import { Post, PostAudience, PostOwnership, PostStatus, PostType } from '../entities/post.js';
import { PageInfo } from './pagination.js';

export interface ListPostsFilters {
  page: number;
  limit: number;
  classId: string | null;
  studentId: string | null;
  authorId: string | null;
  type: PostType | null;
  /** `RASCUNHO` só devolve o que o próprio ator escreveu — rascunho alheio não é feed. */
  status: PostStatus;
  /** O ator sempre, mesmo com abrangência ESCOLA: é por ele que o rascunho é filtrado. */
  actorId: string;
  // `null` não é "sem filtro por engano": é o ator de abrangência ESCOLA, para quem o
  // recorte de audiência não se aplica. Quem decide isso é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListPostsResult {
  items: Post[];
  pagination: PageInfo;
}

export interface CreatePostData {
  authorId: string;
  audience: PostAudience;
  classIds: string[];
  studentIds: string[];
  type: PostType;
  title: string | null;
  body: string | null;
  referenceDate: string | null;
}

export interface UpdatePostData {
  type?: PostType;
  title?: string | null;
  body?: string | null;
  referenceDate?: string;
  audience?: PostAudience;
  classIds?: string[];
  studentIds?: string[];
}

export interface IPostRepository {
  list(filters: ListPostsFilters): Promise<ListPostsResult>;
  /**
   * `viewerId` null dispensa o recorte de audiência (abrangência ESCOLA, ou releitura
   * depois de uma escrita já autorizada). `actorId` libera o rascunho — e só o do próprio
   * ator: rascunho não tem audiência, é do autor e de mais ninguém.
   */
  findById(postId: string, viewerId: string | null, actorId: string | null): Promise<Post | null>;

  findOwnership(postId: string): Promise<PostOwnership | null>;

  /** Os ids que o ator NÃO pode endereçar. Vazio significa que a escrita é permitida. */
  findClassesOutOfScope(classIds: string[], actorId: string): Promise<string[]>;
  findStudentsOutOfScope(studentIds: string[], actorId: string): Promise<string[]>;

  create(data: CreatePostData): Promise<string>;
  update(postId: string, data: UpdatePostData): Promise<boolean>;
  publish(postId: string): Promise<boolean>;
  softDelete(postId: string): Promise<boolean>;
}
