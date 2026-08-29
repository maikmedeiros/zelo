import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateStudentInput } from '../../../../application/dtos/students/create-student/input.js';
import { CreateStudentOutput } from '../../../../application/dtos/students/create-student/output.js';
import { StudentMapper } from '../../../../application/mappers/students/student-mapper.js';
import { CreateStudentUseCase } from '../../../../application/use-cases/students/create-student/create-student.usecase.js';

export class CreateStudentController {
  constructor(private readonly useCase: CreateStudentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateStudentOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateStudentInput;

    const student = await this.useCase.execute({
      personId: input.personId,
      code: input.code,
      notes: input.notes,
      actorId: actor.id,
    });

    return { statusCode: 201, body: StudentMapper.toOutput(student) };
  }
}
