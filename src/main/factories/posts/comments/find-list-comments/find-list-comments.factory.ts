import { db } from '@config/database.js';
import { FindListCommentsUseCase } from '@modules/application/use-cases/posts/comments/find-list-comments/find-list-comments.usecase.js';
import { CommentRepository } from '@modules/infra/repositories/comment.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { FindListCommentsController } from '@modules/presentation/controllers/posts/comments/find-list-comments/find-list-comments.controller.js';

export const makeFindListCommentsController = (): FindListCommentsController =>
  new FindListCommentsController(
    new FindListCommentsUseCase(new PostRepository(db.core), new CommentRepository(db.core)),
  );
