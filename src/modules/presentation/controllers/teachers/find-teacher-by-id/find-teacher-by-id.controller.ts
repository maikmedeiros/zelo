import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindTeacherByIdInput } from '../../../../application/dtos/teachers/find-teacher-by-id/input.js';
import { FindTeacherByIdOutput } from '../../../../application/dtos/teachers/find-teacher-by-id/output.js';
import { TeacherMapper } from '../../../../application/mappers/teachers/teacher-mapper.js';
import { FindTeacherByIdUseCase } from '../../../../application/use-cases/teachers/find-teacher-by-id/find-teacher-by-id.usecase.js';

export class FindTeacherByIdController {
  constructor(
    private readonly useCase: FindTeacherByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindTeacherByIdOutput>> {
    const { actor } = request.context;
    const { teacherId } = request.params as unknown as FindTeacherByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.TeacherView).includes('ESCOLA');
    const item = await this.useCase.execute(teacherId, actor.id, seesWholeSchool ? null : actor.id);

    return { statusCode: 200, body: TeacherMapper.toOutput(item) };
  }
}
