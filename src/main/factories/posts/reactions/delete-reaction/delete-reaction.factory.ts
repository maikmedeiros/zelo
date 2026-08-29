import { db } from '@config/database.js';
import { DeleteReactionUseCase } from '@modules/application/use-cases/posts/reactions/delete-reaction/delete-reaction.usecase.js';
import { ReactionRepository } from '@modules/infra/repositories/reaction.repository.js';
import { DeleteReactionController } from '@modules/presentation/controllers/posts/reactions/delete-reaction/delete-reaction.controller.js';

export const makeDeleteReactionController = (): DeleteReactionController =>
  new DeleteReactionController(new DeleteReactionUseCase(new ReactionRepository(db.core)));
