import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateRoleInput,
  updateRoleParamsSchema,
} from '../../../../application/dtos/roles/update-role/input.js';
import { UpdateRoleOutput } from '../../../../application/dtos/roles/update-role/output.js';
import { RoleMapper } from '../../../../application/mappers/roles/role-mapper.js';
import { UpdateRoleUseCase } from '../../../../application/use-cases/roles/update-role/update-role.usecase.js';

export class UpdateRoleController {
  constructor(
    private readonly useCase: UpdateRoleUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateRoleOutput>> {
    const { actor } = request.context;
    const { roleId } = updateRoleParamsSchema.parse(request.params);
    const input = request.body as UpdateRoleInput;

    const role = await this.useCase.execute(roleId, input, actor.id, (code) =>
      this.scopesOf(actor, code),
    );

    return { statusCode: 200, body: RoleMapper.toOutput(role) };
  }
}
