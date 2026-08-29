import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateCommentInput } from '../../../../../application/dtos/posts/comments/create-comment/input.js';
import { commentParamsSchema } from '../../../../../application/dtos/posts/comments/find-list-comments/input.js';
import {
  CommentMapper,
  CommentOutput,
} from '../../../../../application/mappers/posts/comments/comment-mapper.js';
import { CreateCommentUseCase } from '../../../../../application/use-cases/posts/comments/create-comment/create-comment.usecase.js';

export class CreateCommentController {
  constructor(private readonly useCase: CreateCommentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CommentOutput>> {
    const { actor } = request.context;
    const { postId } = commentParamsSchema.parse(request.params);
    const input = request.body as CreateCommentInput;

    const viewerId = authz.scopesOf(actor, Feature.CommentCreate).includes('ESCOLA')
      ? null
      : actor.id;

    const comment = await this.useCase.execute({
      postId,
      body: input.body,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 201, body: CommentMapper.toOutput(comment) };
  }
}
