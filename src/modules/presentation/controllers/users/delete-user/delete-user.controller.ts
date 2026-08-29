import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteUserInput } from '../../../../application/dtos/users/delete-user/input.js';
import { DeleteUserUseCase } from '../../../../application/use-cases/users/delete-user/delete-user.usecase.js';

export class DeleteUserController {
  constructor(private readonly useCase: DeleteUserUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { userId } = request.params as unknown as DeleteUserInput;

    await this.useCase.execute(userId, actor.id);

    return { statusCode: 204 };
  }
}
