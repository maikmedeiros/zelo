import authz from '@config/authz.js';
import { Feature } from '@config/features.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  commentParamsSchema,
  findListCommentsSchema,
} from '../../../../../application/dtos/posts/comments/find-list-comments/input.js';
import {
  CommentMapper,
  CommentOutput,
} from '../../../../../application/mappers/posts/comments/comment-mapper.js';
import { FindListCommentsUseCase } from '../../../../../application/use-cases/posts/comments/find-list-comments/find-list-comments.usecase.js';

export class FindListCommentsController {
  constructor(private readonly useCase: FindListCommentsUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<CommentOutput>>> {
    const { actor } = request.context;
    const { postId } = commentParamsSchema.parse(request.params);

    // Re-parse: o Express 5 não deixa reatribuir `req.query`, então o valor coergido e
    // defaultado só existe aqui.
    const query = findListCommentsSchema.parse(request.query);

    const viewerId = authz.scopesOf(actor, Feature.CommentView).includes('ESCOLA')
      ? null
      : actor.id;

    const { items, pagination } = await this.useCase.execute({
      postId,
      page: query.page,
      limit: query.limit,
      actorId: actor.id,
      viewerId,
    });

    return { statusCode: 200, body: paginated(items.map(CommentMapper.toOutput), pagination) };
  }
}
