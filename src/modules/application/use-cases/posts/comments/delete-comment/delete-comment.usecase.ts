import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { CommentOwnership } from '../../../../../domain/entities/comment.js';
import { ICommentRepository } from '../../../../../domain/repositories/i-comment-repository.js';

export type CommentGuard = (ownership: CommentOwnership) => boolean;

export interface DeleteCommentInput {
  postId: string;
  commentId: string;
  actorId: string;
  reason: string | null;
  guard: CommentGuard;
}

export class DeleteCommentUseCase {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async execute(input: DeleteCommentInput): Promise<void> {
    const ownership = await this.commentRepo.findOwnership(input.commentId, input.postId);

    if (!ownership || !input.guard(ownership)) {
      throw new NotFoundError({ message: 'Comentário não encontrado' });
    }

    // Quem é o autor remove pela abrangência PROPRIA; quem não é só passou no guard por
    // TURMA ou ESCOLA, e isso é moderação. Os dois casos gravam status diferente, porque a
    // diferença importa para a família que vê a lápide: "retirei o que eu disse" não é a
    // mesma coisa que "a escola retirou o que você disse".
    const byAuthor = ownership.authorId === input.actorId;

    if (!byAuthor && !input.reason) {
      throw new UnprocessableEntityError({
        message: 'A remoção pela escola exige o motivo',
        cause: { campo: 'reason' },
      });
    }

    const removeu = await this.commentRepo.remove({
      commentId: input.commentId,
      postId: input.postId,
      removedBy: input.actorId,
      byAuthor,
      // O motivo do próprio autor não é gravado: ele não deve satisfação, e guardar um texto
      // livre dele aqui confundiria com o registro da moderação.
      reason: byAuthor ? null : (input.reason ?? null),
    });

    // Zero linhas com o ownership carregado significa que o comentário já estava removido.
    if (!removeu) throw new NotFoundError({ message: 'Comentário não encontrado' });
  }
}
