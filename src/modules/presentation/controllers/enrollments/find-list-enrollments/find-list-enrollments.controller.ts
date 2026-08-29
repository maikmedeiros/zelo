import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListEnrollmentsSchema } from '../../../../application/dtos/enrollments/find-list-enrollments/input.js';
import { FindListEnrollmentsOutput } from '../../../../application/dtos/enrollments/find-list-enrollments/output.js';
import { EnrollmentMapper } from '../../../../application/mappers/enrollments/enrollment-mapper.js';
import { FindListEnrollmentsUseCase } from '../../../../application/use-cases/enrollments/find-list-enrollments/find-list-enrollments.usecase.js';

export class FindListEnrollmentsController {
  constructor(
    private readonly useCase: FindListEnrollmentsUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<FindListEnrollmentsOutput>>> {
    const { actor } = request.context;
    const query = findListEnrollmentsSchema.parse(request.query);

    const seesWholeSchool = this.scopesOf(actor, Feature.EnrollmentView).includes('ESCOLA');

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      studentId: query.studentId ?? null,
      classId: query.classId ?? null,
      active: query.active ?? null,
      actorId: actor.id,
      viewerId: seesWholeSchool ? null : actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(EnrollmentMapper.toOutput), pagination) };
  }
}
