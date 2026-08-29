import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteStudentInput } from '../../../../application/dtos/students/delete-student/input.js';
import { DeleteStudentUseCase } from '../../../../application/use-cases/students/delete-student/delete-student.usecase.js';

export class DeleteStudentController {
  constructor(private readonly useCase: DeleteStudentUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { studentId } = request.params as unknown as DeleteStudentInput;

    await this.useCase.execute(studentId, actor.id);

    return { statusCode: 204 };
  }
}
