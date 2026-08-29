import { NotFoundError } from '@shared/errors/index.js';
import { IMediaRepository } from '../../../../../domain/repositories/i-media-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { PostGuard } from '../../update-post/update-post.usecase.js';
import { assertPostWritable } from '../media-access.js';

export class DeleteMediaUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly mediaRepo: IMediaRepository,
  ) {}

  async execute(postId: string, mediaId: string, guard: PostGuard): Promise<void> {
    await assertPostWritable(this.postRepo, postId, guard);

    const removeu = await this.mediaRepo.remove(mediaId, postId);
    if (!removeu) throw new NotFoundError({ message: 'Mídia não encontrada' });

    // O arquivo fica no disco de propósito: o nome é o hash do conteúdo, então duas
    // postagens com a mesma foto compartilham o arquivo, e apagar aqui cegaria a outra.
  }
}
