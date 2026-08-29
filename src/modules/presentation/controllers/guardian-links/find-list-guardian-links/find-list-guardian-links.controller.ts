import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListGuardianLinksSchema } from '../../../../application/dtos/guardian-links/find-list-guardian-links/input.js';
import { FindListGuardianLinksOutput } from '../../../../application/dtos/guardian-links/find-list-guardian-links/output.js';
import { GuardianLinkMapper } from '../../../../application/mappers/guardian-links/guardian-link-mapper.js';
import { FindListGuardianLinksUseCase } from '../../../../application/use-cases/guardian-links/find-list-guardian-links/find-list-guardian-links.usecase.js';

export class FindListGuardianLinksController {
  constructor(
    private readonly useCase: FindListGuardianLinksUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<FindListGuardianLinksOutput>>> {
    const { actor } = request.context;
    const query = findListGuardianLinksSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.GuardianLinkView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      guardianId: query.guardianId ?? null,
      studentId: query.studentId ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(GuardianLinkMapper.toOutput), pagination) };
  }
}
