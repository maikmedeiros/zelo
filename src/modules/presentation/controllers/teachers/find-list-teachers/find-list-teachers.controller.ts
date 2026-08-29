import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListTeachersSchema } from '../../../../application/dtos/teachers/find-list-teachers/input.js';
import { FindListTeachersOutput } from '../../../../application/dtos/teachers/find-list-teachers/output.js';
import { TeacherMapper } from '../../../../application/mappers/teachers/teacher-mapper.js';
import { FindListTeachersUseCase } from '../../../../application/use-cases/teachers/find-list-teachers/find-list-teachers.usecase.js';

export class FindListTeachersController {
  constructor(
    private readonly useCase: FindListTeachersUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListTeachersOutput>>> {
    const { actor } = request.context;
    const query = findListTeachersSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.TeacherView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      classId: query.classId ?? null,
      search: query.search ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(TeacherMapper.toOutput), pagination) };
  }
}
