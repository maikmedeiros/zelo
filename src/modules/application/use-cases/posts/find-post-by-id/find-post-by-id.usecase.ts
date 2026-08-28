import { NotFoundError } from '@shared/errors/index.js';
import { Post } from '../../../../domain/entities/post.js';
import { IPostRepository } from '../../../../domain/repositories/i-post-repository.js';

export class FindPostByIdUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(postId: string, viewerId: string | null): Promise<Post> {
    const post = await this.postRepo.findById(postId, viewerId);

    // 404, nunca 403: negar por permissão confirmaria que a postagem existe. Quem está fora
    // da audiência não distingue "não é sua" de "não existe" — que é o ponto.
    if (!post) throw new NotFoundError({ message: 'Postagem não encontrada' });

    return post;
  }
}
