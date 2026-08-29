import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListTeacherLinksSchema } from '../../../../application/dtos/teacher-links/find-list-teacher-links/input.js';
import { FindListTeacherLinksOutput } from '../../../../application/dtos/teacher-links/find-list-teacher-links/output.js';
import { TeacherLinkMapper } from '../../../../application/mappers/teacher-links/teacher-link-mapper.js';
import { FindListTeacherLinksUseCase } from '../../../../application/use-cases/teacher-links/find-list-teacher-links/find-list-teacher-links.usecase.js';

export class FindListTeacherLinksController {
  constructor(
    private readonly useCase: FindListTeacherLinksUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<FindListTeacherLinksOutput>>> {
    const { actor } = request.context;
    const query = findListTeacherLinksSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.TeacherLinkView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      teacherId: query.teacherId ?? null,
      classId: query.classId ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(TeacherLinkMapper.toOutput), pagination) };
  }
}
