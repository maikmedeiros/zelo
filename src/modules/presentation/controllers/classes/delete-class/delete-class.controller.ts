import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteClassInput } from '../../../../application/dtos/classes/delete-class/input.js';
import { DeleteClassUseCase } from '../../../../application/use-cases/classes/delete-class/delete-class.usecase.js';

export class DeleteClassController {
  constructor(private readonly useCase: DeleteClassUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { classId } = request.params as unknown as DeleteClassInput;

    await this.useCase.execute(classId, actor.id);

    return { statusCode: 204 };
  }
}
