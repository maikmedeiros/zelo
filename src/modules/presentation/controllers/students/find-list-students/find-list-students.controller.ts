import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListStudentsSchema } from '../../../../application/dtos/students/find-list-students/input.js';
import { FindListStudentsOutput } from '../../../../application/dtos/students/find-list-students/output.js';
import { StudentMapper } from '../../../../application/mappers/students/student-mapper.js';
import { FindListStudentsUseCase } from '../../../../application/use-cases/students/find-list-students/find-list-students.usecase.js';

export class FindListStudentsController {
  constructor(
    private readonly useCase: FindListStudentsUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListStudentsOutput>>> {
    const { actor } = request.context;
    const query = findListStudentsSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.StudentView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      classId: query.classId ?? null,
      search: query.search ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(StudentMapper.toOutput), pagination) };
  }
}
