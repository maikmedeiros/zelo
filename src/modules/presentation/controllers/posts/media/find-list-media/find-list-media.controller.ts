import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { postMediaParamsSchema } from '../../../../../application/dtos/posts/media/find-media-by-id/input.js';
import {
  MediaMapper,
  MediaOutput,
} from '../../../../../application/mappers/posts/media/media-mapper.js';
import { FindListMediaUseCase } from '../../../../../application/use-cases/posts/media/find-list-media/find-list-media.usecase.js';

export class FindListMediaController {
  constructor(private readonly useCase: FindListMediaUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<{ results: MediaOutput[] }>> {
    const { actor } = request.context;
    const { postId } = postMediaParamsSchema.parse(request.params);

    const viewerId = authz.scopesOf(actor, Feature.MediaView).includes('ESCOLA') ? null : actor.id;

    const items = await this.useCase.execute(postId, actor.id, viewerId);

    // `results` sem paginação: a galeria de uma postagem não é coleção que se pagine, e
    // devolver o envelope completo prometeria um `page` que não existe.
    return { statusCode: 200, body: { results: items.map(MediaMapper.toOutput) } };
  }
}
