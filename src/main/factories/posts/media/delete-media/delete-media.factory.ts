import authz from '@config/authz.js';
import { db } from '@config/database.js';
import { DeleteMediaUseCase } from '@modules/application/use-cases/posts/media/delete-media/delete-media.usecase.js';
import { MediaRepository } from '@modules/infra/repositories/media.repository.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { DeleteMediaController } from '@modules/presentation/controllers/posts/media/delete-media/delete-media.controller.js';

export const makeDeleteMediaController = (): DeleteMediaController =>
  new DeleteMediaController(
    new DeleteMediaUseCase(new PostRepository(db.core), new MediaRepository(db.core)),
    authz.can,
  );
