import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reactionParamsSchema } from '../../../../../application/dtos/posts/reactions/find-reaction-summary/input.js';
import { SetReactionInput } from '../../../../../application/dtos/posts/reactions/set-reaction/input.js';
import {
  ReactionMapper,
  ReactionSummaryOutput,
} from '../../../../../application/mappers/posts/reactions/reaction-mapper.js';
import { SetReactionUseCase } from '../../../../../application/use-cases/posts/reactions/set-reaction/set-reaction.usecase.js';

export class SetReactionController {
  constructor(private readonly useCase: SetReactionUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<ReactionSummaryOutput>> {
    const { actor } = request.context;
    const { postId } = reactionParamsSchema.parse(request.params);
    const input = request.body as SetReactionInput;

    const viewerId = authz.scopesOf(actor, Feature.ReactionCreate).includes('ESCOLA')
      ? null
      : actor.id;

    const summary = await this.useCase.execute(postId, actor.id, viewerId, input.code);

    // 200 e não 201: o PUT é idempotente e a linha pode já existir — trocar joinha por
    // coração não cria recurso novo.
    return { statusCode: 200, body: ReactionMapper.summaryToOutput(summary) };
  }
}
