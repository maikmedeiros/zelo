import { IFileStorage } from '@shared/infra/storage/index.js';
import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IMAGE_MIME_TYPES, extensionFor, sniffImageMime } from '@shared/utils/image/index.js';
import { IPersonRepository } from '../../../../../domain/repositories/i-person-repository.js';
import { UpdatePhotoOutput } from '../../../../dtos/people/photo/update-photo/output.js';

export interface UpdatePhotoData {
  personId: string;
  originalName: string;
  content: Buffer;
  actorId: string;
  /** Abrangência PROPRIA: sem ESCOLA, só a própria foto. Resolvido pelo controller. */
  ownOnly: boolean;
}

export class UpdatePhotoUseCase {
  constructor(
    private readonly personRepo: IPersonRepository,
    private readonly storage: IFileStorage,
  ) {}

  async execute(data: UpdatePhotoData): Promise<UpdatePhotoOutput> {
    const mimeType = sniffImageMime(data.content);

    if (!mimeType) {
      throw new UnprocessableEntityError({
        message: 'O arquivo enviado não é uma imagem suportada',
        cause: { aceitos: IMAGE_MIME_TYPES },
      });
    }

    // A escrita em disco fica FORA de qualquer transação (CLAUDE.md §7): disco não faz
    // rollback. Se o UPDATE abaixo falhar, sobra um arquivo órfão — inofensivo, porque o nome
    // carrega o hash do conteúdo e um reenvio reaproveita exatamente o mesmo arquivo.
    const stored = await this.storage.save({
      folder: 'pessoas',
      originalName: data.originalName,
      content: data.content,
      mimeType,
      extension: extensionFor(mimeType),
    });

    const gravado = await this.personRepo.updatePhotoKey(
      data.personId,
      stored.storedPath,
      data.actorId,
      data.ownOnly,
    );

    // Pessoa inexistente, de outra escola, ou a de outra pessoa sem abrangência ESCOLA. Os
    // três respondem 404 pelo mesmo motivo do `find-photo`.
    if (!gravado) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    return {
      personId: data.personId,
      key: stored.storedPath,
      sizeBytes: stored.sizeBytes,
      mimeType,
    };
  }
}
