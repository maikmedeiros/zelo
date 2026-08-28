import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { FindListPostsUseCase } from '@modules/application/use-cases/posts/find-list-posts/find-list-posts.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { FindListPostsController } from '@modules/presentation/controllers/posts/find-list-posts/find-list-posts.controller.js';

export const makeFindListPostsController = (): FindListPostsController =>
  new FindListPostsController(
    new FindListPostsUseCase(new PostRepository(db.core)),
    authz.scopesOf,
  );
