import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { DeletePostUseCase } from '@modules/application/use-cases/posts/delete-post/delete-post.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { DeletePostController } from '@modules/presentation/controllers/posts/delete-post/delete-post.controller.js';

export const makeDeletePostController = (): DeletePostController =>
  new DeletePostController(new DeletePostUseCase(new PostRepository(db.core)), authz.can);
