import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateUserInput } from '../../../../application/dtos/users/create-user/input.js';
import { CreateUserOutput } from '../../../../application/dtos/users/create-user/output.js';
import { UserAccountMapper } from '../../../../application/mappers/users/user-account-mapper.js';
import { CreateUserUseCase } from '../../../../application/use-cases/users/create-user/create-user.usecase.js';

export class CreateUserController {
  constructor(private readonly useCase: CreateUserUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateUserOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateUserInput;

    const user = await this.useCase.execute({
      personId: input.personId,
      email: input.email,
      password: input.password,
      actorId: actor.id,
    });

    return { statusCode: 201, body: UserAccountMapper.toOutput(user) };
  }
}
