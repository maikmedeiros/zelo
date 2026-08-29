import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindRoleByIdInput } from '../../../../application/dtos/roles/find-role-by-id/input.js';
import { FindRoleByIdOutput } from '../../../../application/dtos/roles/find-role-by-id/output.js';
import { RoleMapper } from '../../../../application/mappers/roles/role-mapper.js';
import { FindRoleByIdUseCase } from '../../../../application/use-cases/roles/find-role-by-id/find-role-by-id.usecase.js';

export class FindRoleByIdController {
  constructor(private readonly useCase: FindRoleByIdUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindRoleByIdOutput>> {
    const { actor } = request.context;
    const { roleId } = request.params as unknown as FindRoleByIdInput;

    const role = await this.useCase.execute(roleId, actor.id);

    return { statusCode: 200, body: RoleMapper.toOutput(role) };
  }
}
