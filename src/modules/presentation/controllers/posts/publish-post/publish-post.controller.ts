import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { PublishPostOutput } from '../../../../application/dtos/posts/publish-post/output.js';
import { PostMapper } from '../../../../application/mappers/posts/post-mapper.js';
import { PublishPostUseCase } from '../../../../application/use-cases/posts/publish-post/publish-post.usecase.js';
import { Can, makePostGuard } from '../post-guard.js';

export class PublishPostController {
  constructor(
    private readonly useCase: PublishPostUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<PublishPostOutput>> {
    const { actor } = request.context;
    const { postId } = request.params as { postId: string };

    const post = await this.useCase.execute(
      postId,
      makePostGuard(this.can, actor as Actor, Feature.PostPublish),
    );

    return { statusCode: 200, body: PostMapper.toOutput(post) };
  }
}
