import { Comment, CommentOwnership } from '../entities/comment.js';
import { PageInfo } from './pagination.js';

export interface ListCommentsFilters {
  page: number;
  limit: number;
  postId: string;
}

export interface ListCommentsResult {
  items: Comment[];
  pagination: PageInfo;
}

export interface CreateCommentData {
  postId: string;
  authorId: string;
  body: string;
}

export interface RemoveCommentData {
  commentId: string;
  postId: string;
  removedBy: string;
  /** `true` grava REMOVIDO_PELO_AUTOR; `false`, REMOVIDO_PELA_ESCOLA com o motivo. */
  byAuthor: boolean;
  reason: string | null;
}

export interface ICommentRepository {
  list(filters: ListCommentsFilters): Promise<ListCommentsResult>;
  findOwnership(commentId: string, postId: string): Promise<CommentOwnership | null>;
  create(data: CreateCommentData): Promise<Comment>;
  remove(data: RemoveCommentData): Promise<boolean>;
}
