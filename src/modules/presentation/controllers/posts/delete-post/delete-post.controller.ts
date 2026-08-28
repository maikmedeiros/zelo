import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeletePostUseCase } from '../../../../application/use-cases/posts/delete-post/delete-post.usecase.js';
import { Can, makePostGuard } from '../post-guard.js';

export class DeletePostController {
  constructor(
    private readonly useCase: DeletePostUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { postId } = request.params as { postId: string };

    await this.useCase.execute(postId, makePostGuard(this.can, actor as Actor, Feature.PostDelete));

    return { statusCode: 204 };
  }
}
