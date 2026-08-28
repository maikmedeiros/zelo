import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindPostByIdUseCase } from '@modules/application/use-cases/posts/find-post-by-id/find-post-by-id.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { FindPostByIdController } from '@modules/presentation/controllers/posts/find-post-by-id/find-post-by-id.controller.js';

export const makeFindPostByIdController = (): FindPostByIdController =>
  new FindPostByIdController(new FindPostByIdUseCase(new PostRepository(db.core)), authz.scopesOf);
