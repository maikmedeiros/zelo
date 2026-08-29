import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListUsersSchema } from '../../../../application/dtos/users/find-list-users/input.js';
import { FindListUsersOutput } from '../../../../application/dtos/users/find-list-users/output.js';
import { UserAccountMapper } from '../../../../application/mappers/users/user-account-mapper.js';
import { FindListUsersUseCase } from '../../../../application/use-cases/users/find-list-users/find-list-users.usecase.js';

export class FindListUsersController {
  constructor(
    private readonly useCase: FindListUsersUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListUsersOutput>>> {
    const { actor } = request.context;
    const query = findListUsersSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.UserView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search ?? null,
      active: query.active ?? null,
      profile: query.profile ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(UserAccountMapper.toOutput), pagination) };
  }
}
