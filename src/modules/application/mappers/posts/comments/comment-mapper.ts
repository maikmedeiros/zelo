import { PaginatedRow } from '@shared/infra/database/index.js';
import { Comment, CommentStatus } from '../../../../domain/entities/comment.js';

export interface CommentOutput {
  id: string;
  postId: string;
  authorId: string;
  /** A foto vive em `/people/:personId/photo`: sem isto o cliente não a alcança. */
  authorPersonId: string;
  authorName: string;
  body: string | null;
  status: CommentStatus;
  removalReason: string | null;
  createdAt: string;
  editedAt: string | null;
}

export interface CommentPersistenceRow extends PaginatedRow {
  ID: string;
  POSTAGEM_ID: string;
  AUTOR_ID: string;
  AUTOR_PESSOA_ID: string;
  AUTOR_NOME: string;
  CORPO: string | null;
  STATUS: CommentStatus;
  MOTIVO_REMOCAO: string | null;
  CRIADO_EM: Date;
  EDITADO_EM: Date | null;
}

export class CommentMapper {
  static fromPersistence(row: CommentPersistenceRow): Comment {
    return {
      id: row.ID,
      postId: row.POSTAGEM_ID,
      authorId: row.AUTOR_ID,
      authorPersonId: row.AUTOR_PESSOA_ID,
      authorName: row.AUTOR_NOME,
      body: row.CORPO,
      status: row.STATUS,
      removalReason: row.MOTIVO_REMOCAO,
      createdAt: row.CRIADO_EM,
      editedAt: row.EDITADO_EM,
    };
  }

  static toOutput(comment: Comment): CommentOutput {
    return {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      editedAt: comment.editedAt?.toISOString() ?? null,
    };
  }
}
