import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindUserByIdInput } from '../../../../application/dtos/users/find-user-by-id/input.js';
import { FindUserByIdOutput } from '../../../../application/dtos/users/find-user-by-id/output.js';
import { UserAccountMapper } from '../../../../application/mappers/users/user-account-mapper.js';
import { FindUserByIdUseCase } from '../../../../application/use-cases/users/find-user-by-id/find-user-by-id.usecase.js';

export class FindUserByIdController {
  constructor(
    private readonly useCase: FindUserByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindUserByIdOutput>> {
    const { actor } = request.context;
    const { userId } = request.params as unknown as FindUserByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.UserView).includes('ESCOLA');
    const user = await this.useCase.execute(userId, actor.id, seesWholeSchool ? null : actor.id);

    return { statusCode: 200, body: UserAccountMapper.toOutput(user) };
  }
}
