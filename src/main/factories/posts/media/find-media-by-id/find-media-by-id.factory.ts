import { db } from '@config/database.js';
import { storage } from '@config/storage.js';
import { FindMediaByIdUseCase } from '@modules/application/use-cases/posts/media/find-media-by-id/find-media-by-id.usecase.js';
import { MediaRepository } from '@modules/infra/repositories/media.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { FindMediaByIdController } from '@modules/presentation/controllers/posts/media/find-media-by-id/find-media-by-id.controller.js';

export const makeFindMediaByIdController = (): FindMediaByIdController =>
  new FindMediaByIdController(
    new FindMediaByIdUseCase(new PostRepository(db.core), new MediaRepository(db.core), storage),
  );
