import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListClassAccessesSchema } from '../../../../application/dtos/class-accesses/find-list-class-accesses/input.js';
import { FindListClassAccessesOutput } from '../../../../application/dtos/class-accesses/find-list-class-accesses/output.js';
import { ClassAccessMapper } from '../../../../application/mappers/class-accesses/class-access-mapper.js';
import { FindListClassAccessesUseCase } from '../../../../application/use-cases/class-accesses/find-list-class-accesses/find-list-class-accesses.usecase.js';

export class FindListClassAccessesController {
  constructor(
    private readonly useCase: FindListClassAccessesUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<FindListClassAccessesOutput>>> {
    const { actor } = request.context;
    const query = findListClassAccessesSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.ClassAccessView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      userId: query.userId ?? null,
      classId: query.classId ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(ClassAccessMapper.toOutput), pagination) };
  }
}
