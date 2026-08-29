import { ReactionSummary } from '../../../../../domain/entities/reaction.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { IReactionRepository } from '../../../../../domain/repositories/i-reaction-repository.js';
import { assertPostVisible } from '../../media/media-access.js';

export class FindReactionSummaryUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly reactionRepo: IReactionRepository,
  ) {}

  async execute(
    postId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<ReactionSummary> {
    await assertPostVisible(this.postRepo, postId, actorId, viewerId);
    return this.reactionRepo.summary(postId, actorId);
  }
}
