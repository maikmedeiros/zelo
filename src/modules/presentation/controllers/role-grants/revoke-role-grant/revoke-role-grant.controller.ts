import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeRoleGrantInput } from '../../../../application/dtos/role-grants/revoke-role-grant/input.js';
import { RevokeRoleGrantUseCase } from '../../../../application/use-cases/role-grants/revoke-role-grant/revoke-role-grant.usecase.js';

export class RevokeRoleGrantController {
  constructor(private readonly useCase: RevokeRoleGrantUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { grantId } = request.params as unknown as RevokeRoleGrantInput;

    await this.useCase.execute(grantId, actor.id);

    return { statusCode: 204 };
  }
}
