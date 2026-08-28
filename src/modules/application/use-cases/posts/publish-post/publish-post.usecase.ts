import { ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { Post } from '../../../../domain/entities/post.js';
import { IPostRepository } from '../../../../domain/repositories/i-post-repository.js';
import { PostGuard } from '../update-post/update-post.usecase.js';

export class PublishPostUseCase {
  constructor(private readonly postRepo: IPostRepository) {}

  async execute(postId: string, guard: PostGuard): Promise<Post> {
    const ownership = await this.postRepo.findOwnership(postId);

    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Postagem não encontrada' });
    }

    // 409 e não 422: publicar o que já está publicado não viola regra de negócio, conflita
    // com o estado atual do recurso.
    if (ownership.status !== 'RASCUNHO') {
      throw new ConflictError({
        message: `Só rascunho pode ser publicado — esta postagem está ${ownership.status}`,
      });
    }

    // O modelo pede que postagem publicada tenha corpo OU ao menos uma mídia. Mídia é da
    // Fase 4; até lá a única forma de satisfazer a invariante é o corpo.
    // TODO(midia): relaxar para `hasBody || temMidia` quando o upload existir.
    if (!ownership.hasBody) {
      throw new UnprocessableEntityError({
        message: 'Postagem publicada precisa ter corpo',
      });
    }

    const publicou = await this.postRepo.publish(postId);
    if (!publicou) throw new NotFoundError({ message: 'Postagem não encontrada' });

    const post = await this.postRepo.findById(postId, null, ownership.authorId);
    if (!post) throw new NotFoundError({ message: 'Postagem não encontrada' });

    return post;
  }
}
