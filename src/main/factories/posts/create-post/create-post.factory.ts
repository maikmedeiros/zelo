import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { CreatePostUseCase } from '@modules/application/use-cases/posts/create-post/create-post.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { CreatePostController } from '@modules/presentation/controllers/posts/create-post/create-post.controller.js';

export const makeCreatePostController = (): CreatePostController =>
  new CreatePostController(
    new CreatePostUseCase(new PostRepository(db.core), db.core),
    authz.scopesOf,
  );
