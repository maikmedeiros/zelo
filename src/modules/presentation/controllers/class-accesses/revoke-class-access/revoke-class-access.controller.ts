import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { RevokeClassAccessInput } from '../../../../application/dtos/class-accesses/revoke-class-access/input.js';
import { RevokeClassAccessUseCase } from '../../../../application/use-cases/class-accesses/revoke-class-access/revoke-class-access.usecase.js';

export class RevokeClassAccessController {
  constructor(private readonly useCase: RevokeClassAccessUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { accessId } = request.params as unknown as RevokeClassAccessInput;

    await this.useCase.execute(accessId, actor.id);

    return { statusCode: 204 };
  }
}
