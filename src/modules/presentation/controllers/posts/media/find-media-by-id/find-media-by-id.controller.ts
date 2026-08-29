import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { mediaItemParamsSchema } from '../../../../../application/dtos/posts/media/find-media-by-id/input.js';
import { FindMediaByIdUseCase } from '../../../../../application/use-cases/posts/media/find-media-by-id/find-media-by-id.usecase.js';

export class FindMediaByIdController {
  constructor(private readonly useCase: FindMediaByIdUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Buffer>> {
    const { actor } = request.context;
    const { postId, mediaId } = mediaItemParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.MediaView).includes('ESCOLA') ? null : actor.id;

    const { content, mimeType } = await this.useCase.execute(postId, mediaId, actor.id, viewerId);

    return {
      statusCode: 200,
      body: content,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(content.byteLength),
        // `private`: é foto de criança atrás de sessão, nunca asset de cache compartilhado.
        'Cache-Control': 'private, max-age=300',
      },
    };
  }
}
