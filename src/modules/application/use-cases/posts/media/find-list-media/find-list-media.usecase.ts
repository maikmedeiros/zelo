import { Media } from '../../../../../domain/entities/media.js';
import { IMediaRepository } from '../../../../../domain/repositories/i-media-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';
import { assertPostVisible } from '../media-access.js';

export class FindListMediaUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly mediaRepo: IMediaRepository,
  ) {}

  async execute(postId: string, actorId: string, viewerId: string | null): Promise<Media[]> {
    await assertPostVisible(this.postRepo, postId, actorId, viewerId);
    return this.mediaRepo.listByPost(postId);
  }
}
