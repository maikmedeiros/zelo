import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateRoleGrantInput } from '../../../../application/dtos/role-grants/create-role-grant/input.js';
import { CreateRoleGrantOutput } from '../../../../application/dtos/role-grants/create-role-grant/output.js';
import { RoleGrantMapper } from '../../../../application/mappers/role-grants/role-grant-mapper.js';
import { CreateRoleGrantUseCase } from '../../../../application/use-cases/role-grants/create-role-grant/create-role-grant.usecase.js';

export class CreateRoleGrantController {
  constructor(
    private readonly useCase: CreateRoleGrantUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateRoleGrantOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateRoleGrantInput;

    const grant = await this.useCase.execute(
      {
        userId: input.userId,
        roleId: input.roleId,
        startDate: input.startDate ?? null,
        grantedBy: actor.id,
        actorId: actor.id,
      },
      (code) => this.scopesOf(actor, code),
    );

    return { statusCode: 201, body: RoleGrantMapper.toOutput(grant) };
  }
}
