import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateGuardianInput } from '../../../../application/dtos/guardians/create-guardian/input.js';
import { CreateGuardianOutput } from '../../../../application/dtos/guardians/create-guardian/output.js';
import { GuardianMapper } from '../../../../application/mappers/guardians/guardian-mapper.js';
import { CreateGuardianUseCase } from '../../../../application/use-cases/guardians/create-guardian/create-guardian.usecase.js';

export class CreateGuardianController {
  constructor(private readonly useCase: CreateGuardianUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateGuardianOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateGuardianInput;

    const guardian = await this.useCase.execute({
      personId: input.personId,
      receiveEmail: input.receiveEmail,
      receivePush: input.receivePush,
      actorId: actor.id,
    });

    return { statusCode: 201, body: GuardianMapper.toOutput(guardian) };
  }
}
