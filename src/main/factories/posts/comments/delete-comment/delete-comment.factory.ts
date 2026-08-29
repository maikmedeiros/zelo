import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { DeleteCommentUseCase } from '@modules/application/use-cases/posts/comments/delete-comment/delete-comment.usecase.js';
import { CommentRepository } from '@modules/infra/repositories/comment.repository.js';
import { DeleteCommentController } from '@modules/presentation/controllers/posts/comments/delete-comment/delete-comment.controller.js';

export const makeDeleteCommentController = (): DeleteCommentController =>
  new DeleteCommentController(new DeleteCommentUseCase(new CommentRepository(db.core)), authz.can);
