import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindPostByIdInput } from '../../../../application/dtos/posts/find-post-by-id/input.js';
import { FindPostByIdOutput } from '../../../../application/dtos/posts/find-post-by-id/output.js';
import { PostMapper } from '../../../../application/mappers/posts/post-mapper.js';
import { FindPostByIdUseCase } from '../../../../application/use-cases/posts/find-post-by-id/find-post-by-id.usecase.js';

export class FindPostByIdController {
  constructor(
    private readonly useCase: FindPostByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindPostByIdOutput>> {
    const { actor } = request.context;
    const { postId } = request.params as unknown as FindPostByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.PostView).includes('ESCOLA');
    const post = await this.useCase.execute(postId, seesWholeSchool ? null : actor.id);

    return { statusCode: 200, body: PostMapper.toOutput(post) };
  }
}
