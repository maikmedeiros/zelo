import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { mediaItemParamsSchema } from '../../../../../application/dtos/posts/media/find-media-by-id/input.js';
import { DeleteMediaUseCase } from '../../../../../application/use-cases/posts/media/delete-media/delete-media.usecase.js';
import { Can, makePostGuard } from '../../post-guard.js';

export class DeleteMediaController {
  constructor(
    private readonly useCase: DeleteMediaUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { postId, mediaId } = mediaItemParamsSchema.parse(request.params);

    await this.useCase.execute(
      postId,
      mediaId,
      makePostGuard(this.can, actor as Actor, Feature.MediaDelete),
    );

    return { statusCode: 204 };
  }
}
