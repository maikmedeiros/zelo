import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindStudentByIdInput } from '../../../../application/dtos/students/find-student-by-id/input.js';
import { FindStudentByIdOutput } from '../../../../application/dtos/students/find-student-by-id/output.js';
import { StudentMapper } from '../../../../application/mappers/students/student-mapper.js';
import { FindStudentByIdUseCase } from '../../../../application/use-cases/students/find-student-by-id/find-student-by-id.usecase.js';

export class FindStudentByIdController {
  constructor(
    private readonly useCase: FindStudentByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindStudentByIdOutput>> {
    const { actor } = request.context;
    const { studentId } = request.params as unknown as FindStudentByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.StudentView).includes('ESCOLA');
    const student = await this.useCase.execute(
      studentId,
      actor.id,
      seesWholeSchool ? null : actor.id,
    );

    return { statusCode: 200, body: StudentMapper.toOutput(student) };
  }
}
