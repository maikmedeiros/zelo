import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { Comment } from '../../../../../domain/entities/comment.js';
import { ICommentRepository } from '../../../../../domain/repositories/i-comment-repository.js';
import { IPostRepository } from '../../../../../domain/repositories/i-post-repository.js';

export interface CreateCommentInput {
  postId: string;
  body: string;
  actorId: string;
  viewerId: string | null;
}

export class CreateCommentUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
  ) {}

  async execute(input: CreateCommentInput): Promise<Comment> {
    // Comentar exige alcançar a postagem como LEITOR, e não como autor — é a diferença que
    // dá sentido à fase: o responsável não escreve postagem e responde à que recebeu. Por
    // isso aqui não entra o guard de dono que a mídia usa.
    const post = await this.postRepo.findById(input.postId, input.viewerId, input.actorId);

    if (!post) {
      // 404 e não 403: negar por permissão confirmaria que a postagem existe.
      throw new NotFoundError({ message: 'Postagem não encontrada' });
    }

    // Rascunho não chegou a ninguém, então não há conversa para ter. O autor enxerga o
    // próprio rascunho pelo `findById`, e sem esta guarda comentaria no que ainda não existe
    // para a família. `publishedAt` null é a marca do rascunho — o `findById` já descarta a
    // postagem REMOVIDA, então não há terceiro estado a considerar aqui.
    if (post.publishedAt === null) {
      throw new UnprocessableEntityError({
        message: 'Só postagem publicada aceita comentário',
      });
    }

    return this.commentRepo.create({
      postId: input.postId,
      authorId: input.actorId,
      body: input.body,
    });
  }
}
