import { db } from '@config/database.js';
import { CreateCommentUseCase } from '@modules/application/use-cases/posts/comments/create-comment/create-comment.usecase.js';
import { CommentRepository } from '@modules/infra/repositories/comment.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { CreateCommentController } from '@modules/presentation/controllers/posts/comments/create-comment/create-comment.controller.js';

export const makeCreateCommentController = (): CreateCommentController =>
  new CreateCommentController(
    new CreateCommentUseCase(new PostRepository(db.core), new CommentRepository(db.core)),
  );
