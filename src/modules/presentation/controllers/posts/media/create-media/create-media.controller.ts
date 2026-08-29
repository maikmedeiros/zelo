import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { ValidationError } from '@shared/errors/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { postMediaParamsSchema } from '../../../../../application/dtos/posts/media/find-media-by-id/input.js';
import {
  MediaMapper,
  MediaOutput,
} from '../../../../../application/mappers/posts/media/media-mapper.js';
import { CreateMediaUseCase } from '../../../../../application/use-cases/posts/media/create-media/create-media.usecase.js';
import { Can, makePostGuard } from '../../post-guard.js';

export class CreateMediaController {
  constructor(
    private readonly useCase: CreateMediaUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<MediaOutput>> {
    const { actor } = request.context;
    const { postId } = postMediaParamsSchema.parse(request.params);

    const file = request.file;
    if (!file) {
      throw new ValidationError({
        cause: [
          { path: ['file'], message: 'Envie a imagem no campo `file` (multipart/form-data)' },
        ],
      });
    }

    const media = await this.useCase.execute({
      postId,
      originalName: file.originalname,
      content: file.buffer,
      guard: makePostGuard(this.can, actor as Actor, Feature.MediaCreate),
    });

    return { statusCode: 201, body: MediaMapper.toOutput(media) };
  }
}
