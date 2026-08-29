import { IFileStorage } from '@shared/infra/storage/index.js';
import { ConflictError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IMAGE_MIME_TYPES, extensionFor, sniffImageMime } from '@shared/utils/image/index.js';
import { Media } from '../../../../../domain/entities/media.js';
import { IMediaRepository } from '../../../../../domain/repositories/i-media-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { PostGuard } from '../../update-post/update-post.usecase.js';
import { assertPostWritable } from '../media-access.js';

export interface CreateMediaData {
  postId: string;
  originalName: string;
  content: Buffer;
  guard: PostGuard;
}

export class CreateMediaUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storage: IFileStorage,
  ) {}

  async execute(data: CreateMediaData): Promise<Media> {
    const ownership = await assertPostWritable(this.postRepo, data.postId, data.guard);

    // Anexar foto a postagem publicada entregaria conteúdo novo a quem já foi notificado e
    // já leu — sem que nada avise. Enquanto é rascunho, a postagem não chegou a ninguém.
    if (ownership.status !== 'RASCUNHO') {
      throw new ConflictError({
        message: `Só rascunho aceita mídia nova — esta postagem está ${ownership.status}`,
      });
    }

    const mimeType = sniffImageMime(data.content);

    // A assinatura dos bytes, não o `mimetype` que o cliente anunciou — ver shared/utils/image.
    if (!mimeType) {
      throw new UnprocessableEntityError({
        message: 'O arquivo enviado não é uma imagem suportada',
        cause: { aceitos: IMAGE_MIME_TYPES },
      });
    }

    // Fora de transação, como manda o CLAUDE.md §7: disco não faz rollback. Arquivo órfão é
    // inofensivo — o nome carrega o hash do conteúdo, e o reenvio reaproveita o mesmo arquivo.
    const stored = await this.storage.save({
      folder: 'postagens',
      originalName: data.originalName,
      content: data.content,
      mimeType,
      extension: extensionFor(mimeType),
    });

    return this.mediaRepo.create({
      postId: data.postId,
      key: stored.storedPath,
      mimeType,
      sizeBytes: stored.sizeBytes,
    });
  }
}
