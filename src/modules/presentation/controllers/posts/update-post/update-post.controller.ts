import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { UpdatePostInput } from '../../../../application/dtos/posts/update-post/input.js';
import { UpdatePostOutput } from '../../../../application/dtos/posts/update-post/output.js';
import { PostMapper } from '../../../../application/mappers/posts/post-mapper.js';
import { UpdatePostUseCase } from '../../../../application/use-cases/posts/update-post/update-post.usecase.js';
import { Can, makePostGuard } from '../post-guard.js';

export class UpdatePostController {
  constructor(
    private readonly useCase: UpdatePostUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdatePostOutput>> {
    const { actor } = request.context;
    const { postId } = request.params as { postId: string };

    const post = await this.useCase.execute(
      postId,
      actor.id,
      request.body as UpdatePostInput,
      makePostGuard(this.can, actor as Actor, Feature.PostUpdate),
    );

    return { statusCode: 200, body: PostMapper.toOutput(post) };
  }
}
