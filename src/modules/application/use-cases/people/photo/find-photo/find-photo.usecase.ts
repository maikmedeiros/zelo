import { IFileStorage } from '@shared/infra/storage/index.js';
import { NotFoundError } from '@shared/errors/index.js';
import { mimeFromStoredPath } from '@shared/utils/image/index.js';
import { IPersonRepository } from '../../../../../domain/repositories/i-person-repository.js';
import { FindPhotoOutput } from '../../../../dtos/people/photo/find-photo/output.js';

export class FindPhotoUseCase {
  constructor(
    private readonly personRepo: IPersonRepository,
    private readonly storage: IFileStorage,
  ) {}

  async execute(
    personId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<FindPhotoOutput> {
    const key = await this.personRepo.findPhotoKey(personId, actorId, viewerId);

    // Um 404 só: pessoa fora do alcance, pessoa inexistente e pessoa sem foto respondem
    // igual. Distinguir revelaria que a pessoa existe para quem não pode enxergá-la.
    if (!key) throw new NotFoundError({ message: 'Foto não encontrada' });

    const mimeType = mimeFromStoredPath(key);
    const content = mimeType ? await this.storage.read(key) : null;

    // O banco aponta para um arquivo que o disco não tem. Acontece quando o volume é
    // recriado sem o storage — o seed devolve as pessoas, não as imagens.
    if (!content || !mimeType) throw new NotFoundError({ message: 'Foto não encontrada' });

    return { content, mimeType };
  }
}
