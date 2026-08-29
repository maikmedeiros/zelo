import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reactionParamsSchema } from '../../../../../application/dtos/posts/reactions/find-reaction-summary/input.js';
import {
  ReactionMapper,
  ReactionSummaryOutput,
} from '../../../../../application/mappers/posts/reactions/reaction-mapper.js';
import { FindReactionSummaryUseCase } from '../../../../../application/use-cases/posts/reactions/find-reaction-summary/find-reaction-summary.usecase.js';

export class FindReactionSummaryController {
  constructor(private readonly useCase: FindReactionSummaryUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReactionSummaryOutput>> {
    const { actor } = request.context;
    const { postId } = reactionParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.ReactionView).includes('ESCOLA')
      ? null
      : actor.id;

    const summary = await this.useCase.execute(postId, actor.id, viewerId);

    return { statusCode: 200, body: ReactionMapper.summaryToOutput(summary) };
  }
}
