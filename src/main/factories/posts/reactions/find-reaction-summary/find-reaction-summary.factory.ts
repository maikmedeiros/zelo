import { db } from '@config/database.js';
import { FindReactionSummaryUseCase } from '@modules/application/use-cases/posts/reactions/find-reaction-summary/find-reaction-summary.usecase.js';
import { PostRepository } from '@modules/infra/repositories/post.repository.js';
import { ReactionRepository } from '@modules/infra/repositories/reaction.repository.js';
import { FindReactionSummaryController } from '@modules/presentation/controllers/posts/reactions/find-reaction-summary/find-reaction-summary.controller.js';

export const makeFindReactionSummaryController = (): FindReactionSummaryController =>
  new FindReactionSummaryController(
    new FindReactionSummaryUseCase(new PostRepository(db.core), new ReactionRepository(db.core)),
  );
