import { db } from '@config/database.js';
import { FindListMediaUseCase } from '@modules/application/use-cases/posts/media/find-list-media/find-list-media.usecase.js';
import { MediaRepository } from '@modules/infra/repositories/media.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { FindListMediaController } from '@modules/presentation/controllers/posts/media/find-list-media/find-list-media.controller.js';

export const makeFindListMediaController = (): FindListMediaController =>
  new FindListMediaController(
    new FindListMediaUseCase(new PostRepository(db.core), new MediaRepository(db.core)),
  );
