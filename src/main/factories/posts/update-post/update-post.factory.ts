import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { UpdatePostUseCase } from '@modules/application/use-cases/posts/update-post/update-post.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { UpdatePostController } from '@modules/presentation/controllers/posts/update-post/update-post.controller.js';

export const makeUpdatePostController = (): UpdatePostController =>
  new UpdatePostController(
    new UpdatePostUseCase(new PostRepository(db.core), db.core),
    authz.can,
    authz.scopesOf,
  );
