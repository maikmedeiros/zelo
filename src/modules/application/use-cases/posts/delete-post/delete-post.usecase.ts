import { NotFoundError } from '@shared/errors/index.js';
import { IPostRepository } from '../../../../domain/repositories/i-post-repository.js';
import { PostGuard } from '../update-post/update-post.usecase.js';

export class DeletePostUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(postId: string, guard: PostGuard): Promise<void> {
    const ownership = await this.postRepo.findOwnership(postId);

    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Postagem não encontrada' });
    }

    // Remoção lógica: `status = REMOVIDA`. Apagar a linha levaria comentários e reações
    // junto por cascata, e destruiria o rastro de que a postagem existiu.
    const removeu = await this.postRepo.softDelete(postId);
    if (!removeu) throw new NotFoundError({ message: 'Postagem não encontrada' });
  }
}
