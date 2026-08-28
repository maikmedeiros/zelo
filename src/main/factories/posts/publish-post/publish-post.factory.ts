import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { PublishPostUseCase } from '@modules/application/use-cases/posts/publish-post/publish-post.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { PublishPostController } from '@modules/presentation/controllers/posts/publish-post/publish-post.controller.js';

export const makePublishPostController = (): PublishPostController =>
  new PublishPostController(new PublishPostUseCase(new PostRepository(db.core)), authz.can);
