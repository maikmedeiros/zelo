import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateUserInput,
  updateUserParamsSchema,
} from '../../../../application/dtos/users/update-user/input.js';
import { UpdateUserOutput } from '../../../../application/dtos/users/update-user/output.js';
import { UserAccountMapper } from '../../../../application/mappers/users/user-account-mapper.js';
import { UpdateUserUseCase } from '../../../../application/use-cases/users/update-user/update-user.usecase.js';

export class UpdateUserController {
  constructor(private readonly useCase: UpdateUserUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateUserOutput>> {
    const { actor } = request.context;
    const { userId } = updateUserParamsSchema.parse(request.params);
    const input = request.body as UpdateUserInput;

    const user = await this.useCase.execute(userId, input, actor.id);

    return { statusCode: 200, body: UserAccountMapper.toOutput(user) };
  }
}
