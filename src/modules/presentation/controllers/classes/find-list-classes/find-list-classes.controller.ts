import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListClassesSchema } from '../../../../application/dtos/classes/find-list-classes/input.js';
import { FindListClassesOutput } from '../../../../application/dtos/classes/find-list-classes/output.js';
import { ClassMapper } from '../../../../application/mappers/classes/class-mapper.js';
import { FindListClassesUseCase } from '../../../../application/use-cases/classes/find-list-classes/find-list-classes.usecase.js';

export class FindListClassesController {
  constructor(
    private readonly useCase: FindListClassesUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListClassesOutput>>> {
    const { actor } = request.context;
    const query = findListClassesSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.ClassView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      schoolYearId: query.schoolYearId ?? null,
      shift: query.shift ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(ClassMapper.toOutput), pagination) };
  }
}
