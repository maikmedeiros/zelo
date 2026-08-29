import { IFileStorage } from '@shared/infra/storage/index.js';
import { NotFoundError } from '@shared/errors/index.js';
import { IMediaRepository } from '../../../../../domain/repositories/i-media-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { FindMediaOutput } from '../../../../dtos/posts/media/find-media-by-id/output.js';
import { assertPostVisible } from '../media-access.js';

export class FindMediaByIdUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storage: IFileStorage,
  ) {}

  async execute(
    postId: string,
    mediaId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<FindMediaOutput> {
    await assertPostVisible(this.postRepo, postId, actorId, viewerId);

    const file = await this.mediaRepo.findFile(mediaId, postId);
    if (!file) throw new NotFoundError({ message: 'Mídia não encontrada' });

    const content = await this.storage.read(file.key);

    // Banco apontando para arquivo que o disco não tem. Acontece quando o volume é recriado
    // sem o storage — o seed devolve as postagens, não as imagens.
    if (!content) throw new NotFoundError({ message: 'Mídia não encontrada' });

    return { content, mimeType: file.mimeType };
  }
}
