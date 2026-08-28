import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { Post, PostOwnership } from '../../../../domain/entities/post.js';
import {
  IPostRepository,
  UpdatePostData,
} from '../../../../domain/repositories/i-post-repository.js';
import { assertTargetsInScope } from '../assert-targets-in-scope.js';

export type PostGuard = (ownership: PostOwnership) => boolean;

export class UpdatePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(
    postId: string,
    actorId: string,
    data: UpdatePostData,
    guard: PostGuard,
  ): Promise<Post> {
    const ownership = await this.postRepo.findOwnership(postId);

    // 404 nos dois casos: negar por permissão confirmaria que a postagem existe.
    if (!ownership || !guard(ownership)) {
      throw new NotFoundError({ message: 'Postagem não encontrada' });
    }

    const trocaAudiencia = data.audience !== undefined;

    // Mudar destinatário depois de publicada é tirar de quem já leu, ou entregar a quem não
    // recebeu — e o modelo não registra nem uma coisa nem outra. Enquanto é rascunho, a
    // postagem não chegou a ninguém.
    if (trocaAudiencia && ownership.status !== 'RASCUNHO') {
      throw new UnprocessableEntityError({
        message: 'A audiência só pode mudar enquanto a postagem é rascunho',
      });
    }

    if (trocaAudiencia) {
      await assertTargetsInScope(
        this.postRepo,
        actorId,
        data.classIds ?? [],
        data.studentIds ?? [],
      );
    }

    const alterou = await this.db.transaction(() => this.postRepo.update(postId, data));
    if (!alterou) throw new NotFoundError({ message: 'Postagem não encontrada' });

    const post = await this.postRepo.findById(postId, null, ownership.authorId);
    if (!post) throw new NotFoundError({ message: 'Postagem não encontrada' });

    return post;
  }
}
