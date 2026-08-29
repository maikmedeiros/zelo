import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateGuardianInput,
  updateGuardianParamsSchema,
} from '../../../../application/dtos/guardians/update-guardian/input.js';
import { UpdateGuardianOutput } from '../../../../application/dtos/guardians/update-guardian/output.js';
import { GuardianMapper } from '../../../../application/mappers/guardians/guardian-mapper.js';
import { UpdateGuardianUseCase } from '../../../../application/use-cases/guardians/update-guardian/update-guardian.usecase.js';

export class UpdateGuardianController {
  constructor(private readonly useCase: UpdateGuardianUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateGuardianOutput>> {
    const { actor } = request.context;
    const { guardianId } = updateGuardianParamsSchema.parse(request.params);
    const input = request.body as UpdateGuardianInput;

    const guardian = await this.useCase.execute(guardianId, input, actor.id);

    return { statusCode: 200, body: GuardianMapper.toOutput(guardian) };
  }
}
