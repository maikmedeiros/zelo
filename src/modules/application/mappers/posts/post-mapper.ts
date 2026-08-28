import { PaginatedRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Post, PostType } from '../../../domain/entities/post.js';
import { FindListPostsOutput } from '../../dtos/posts/find-list-posts/output.js';

export interface PostPersistenceRow extends PaginatedRow {
  ID: string;
  TURMA_ID: string;
  NOME_TURMA: string;
  AUTOR_ID: string;
  NOME_AUTOR: string;
  TIPO: PostType;
  TITULO: string | null;
  CORPO: string | null;
  REFERENTE_A: string;
  PUBLICADO_EM: Date;
}

export class PostMapper {
  static fromPersistence(row: PostPersistenceRow): Post {
    return {
      id: row.ID,
      classId: row.TURMA_ID,
      className: row.NOME_TURMA,
      authorId: row.AUTOR_ID,
      authorName: formatPersonName(row.NOME_AUTOR),
      type: row.TIPO,
      title: row.TITULO,
      body: row.CORPO,
      referenceDate: row.REFERENTE_A,
      publishedAt: row.PUBLICADO_EM,
    };
  }

  static toOutput(post: Post): FindListPostsOutput {
    return { ...post, publishedAt: post.publishedAt.toISOString() };
  }
}
