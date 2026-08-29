import { Feature } from '@config/features.js';
import { Actor } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteCommentInput } from '../../../../../application/dtos/posts/comments/delete-comment/input.js';
import { commentItemParamsSchema } from '../../../../../application/dtos/posts/comments/find-list-comments/input.js';
import { DeleteCommentUseCase } from '../../../../../application/use-cases/posts/comments/delete-comment/delete-comment.usecase.js';
import { Can } from '../../post-guard.js';
import { makeCommentGuard } from '../comment-guard.js';

export class DeleteCommentController {
  constructor(
    private readonly useCase: DeleteCommentUseCase,
    private readonly can: Can,
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { postId, commentId } = commentItemParamsSchema.parse(request.params);
    const input = (request.body ?? {}) as DeleteCommentInput;

    await this.useCase.execute({
      postId,
      commentId,
      actorId: actor.id,
      reason: input.reason ?? null,
      guard: makeCommentGuard(this.can, actor as Actor, Feature.CommentDelete),
    });

    return { statusCode: 204 };
  }
}
