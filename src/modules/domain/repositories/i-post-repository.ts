import { Post, PostType } from '../entities/post.js';

export interface PageInfo {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

export interface ListPostsFilters {
  page: number;
  limit: number;
  classId: string | null;
  studentId: string | null;
  type: PostType | null;
  // `null` não é "sem filtro por engano": é o ator de abrangência ESCOLA, para quem o
  // recorte de audiência não se aplica. Quem decide isso é o controller, não a consulta.
  viewerId: string | null;
}

export interface ListPostsResult {
  items: Post[];
  pagination: PageInfo;
}

export interface IPostRepository {
  list(filters: ListPostsFilters): Promise<ListPostsResult>;
}
