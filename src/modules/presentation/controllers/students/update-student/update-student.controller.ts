import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateStudentInput,
  updateStudentParamsSchema,
} from '../../../../application/dtos/students/update-student/input.js';
import { UpdateStudentOutput } from '../../../../application/dtos/students/update-student/output.js';
import { StudentMapper } from '../../../../application/mappers/students/student-mapper.js';
import { UpdateStudentUseCase } from '../../../../application/use-cases/students/update-student/update-student.usecase.js';

export class UpdateStudentController {
  constructor(private readonly useCase: UpdateStudentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateStudentOutput>> {
    const { actor } = request.context;
    const { studentId } = updateStudentParamsSchema.parse(request.params);
    const input = request.body as UpdateStudentInput;

    const student = await this.useCase.execute(studentId, input, actor.id);

    return { statusCode: 200, body: StudentMapper.toOutput(student) };
  }
}
