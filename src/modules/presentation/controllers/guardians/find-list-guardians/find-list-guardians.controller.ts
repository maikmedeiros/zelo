import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListGuardiansSchema } from '../../../../application/dtos/guardians/find-list-guardians/input.js';
import { FindListGuardiansOutput } from '../../../../application/dtos/guardians/find-list-guardians/output.js';
import { GuardianMapper } from '../../../../application/mappers/guardians/guardian-mapper.js';
import { FindListGuardiansUseCase } from '../../../../application/use-cases/guardians/find-list-guardians/find-list-guardians.usecase.js';

export class FindListGuardiansController {
  constructor(
    private readonly useCase: FindListGuardiansUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListGuardiansOutput>>> {
    const { actor } = request.context;
    const query = findListGuardiansSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.GuardianView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      studentId: query.studentId ?? null,
      search: query.search ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(GuardianMapper.toOutput), pagination) };
  }
}
