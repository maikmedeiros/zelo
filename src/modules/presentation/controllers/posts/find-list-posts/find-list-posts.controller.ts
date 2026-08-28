import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListPostsSchema } from '../../../../application/dtos/posts/find-list-posts/input.js';
import { FindListPostsOutput } from '../../../../application/dtos/posts/find-list-posts/output.js';
import { PostMapper } from '../../../../application/mappers/posts/post-mapper.js';
import { FindListPostsUseCase } from '../../../../application/use-cases/posts/find-list-posts/find-list-posts.usecase.js';

export class FindListPostsController {
  constructor(
    private readonly useCase: FindListPostsUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListPostsOutput>>> {
    const { actor } = request.context;

    // O validator já barrou a query inválida; aqui o re-parse é para receber o valor
    // coergido e defaultado, que o req.query cru não tem (Express 5 não deixa reatribuir).
    const query = findListPostsSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.PostView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      classId: query.classId ?? null,
      studentId: query.studentId ?? null,
      authorId: query.authorId ?? null,
      type: query.type ?? null,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(PostMapper.toOutput), pagination) };
  }
}
