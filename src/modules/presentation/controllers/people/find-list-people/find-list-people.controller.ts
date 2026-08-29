import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListPeopleSchema } from '../../../../application/dtos/people/find-list-people/input.js';
import { FindListPeopleOutput } from '../../../../application/dtos/people/find-list-people/output.js';
import { PersonMapper } from '../../../../application/mappers/people/person-mapper.js';
import { FindListPeopleUseCase } from '../../../../application/use-cases/people/find-list-people/find-list-people.usecase.js';

export class FindListPeopleController {
  constructor(
    private readonly useCase: FindListPeopleUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListPeopleOutput>>> {
    const { actor } = request.context;
    const query = findListPeopleSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.PersonView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      cpf: query.cpf ?? null,
      search: query.search ?? null,
      role: query.role ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(PersonMapper.toOutput), pagination) };
  }
}
