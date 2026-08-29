import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { reactionParamsSchema } from '../../../../../application/dtos/posts/reactions/find-reaction-summary/input.js';
import { DeleteReactionUseCase } from '../../../../../application/use-cases/posts/reactions/delete-reaction/delete-reaction.usecase.js';

export class DeleteReactionController {
  constructor(private readonly useCase: DeleteReactionUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { postId } = reactionParamsSchema.parse(request.params);

    // Não há abrangência a resolver: a rota só alcança a reação do próprio ator.
    await this.useCase.execute(postId, actor.id);

    return { statusCode: 204 };
  }
}
