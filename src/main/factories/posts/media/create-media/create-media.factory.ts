import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { storage } from '@config/storage.js';
import { CreateMediaUseCase } from '@modules/application/use-cases/posts/media/create-media/create-media.usecase.js';
import { MediaRepository } from '@modules/infra/repositories/media.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { CreateMediaController } from '@modules/presentation/controllers/posts/media/create-media/create-media.controller.js';

export const makeCreateMediaController = (): CreateMediaController =>
  new CreateMediaController(
    new CreateMediaUseCase(new PostRepository(db.core), new MediaRepository(db.core), storage),
    authz.can,
  );
