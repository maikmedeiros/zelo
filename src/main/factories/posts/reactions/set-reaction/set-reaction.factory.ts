import { db } from '@config/database.js';
import { SetReactionUseCase } from '@modules/application/use-cases/posts/reactions/set-reaction/set-reaction.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { ReactionRepository } from '@modules/infra/repositories/reaction.repository.js';
import { SetReactionController } from '@modules/presentation/controllers/posts/reactions/set-reaction/set-reaction.controller.js';

export const makeSetReactionController = (): SetReactionController =>
  new SetReactionController(
    new SetReactionUseCase(new PostRepository(db.core), new ReactionRepository(db.core)),
  );
