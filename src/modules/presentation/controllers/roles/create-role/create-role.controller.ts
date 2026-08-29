import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateRoleInput } from '../../../../application/dtos/roles/create-role/input.js';
import { CreateRoleOutput } from '../../../../application/dtos/roles/create-role/output.js';
import { RoleMapper } from '../../../../application/mappers/roles/role-mapper.js';
import { CreateRoleUseCase } from '../../../../application/use-cases/roles/create-role/create-role.usecase.js';

export class CreateRoleController {
  constructor(
    private readonly useCase: CreateRoleUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateRoleOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateRoleInput;

    // O use-case recebe o `scopesOf` já fechado sobre o ator, por callback: é assim que o
    // `authz` fica fora da aplicação, como manda o CLAUDE.md §9.
    const role = await this.useCase.execute(
      {
        code: input.code,
        name: input.name,
        description: input.description,
        permissions: input.permissions,
        actorId: actor.id,
      },
      (code) => this.scopesOf(actor, code),
    );

    return { statusCode: 201, body: RoleMapper.toOutput(role) };
  }
}
