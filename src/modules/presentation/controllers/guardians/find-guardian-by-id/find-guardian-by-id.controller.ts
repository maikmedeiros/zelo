import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindGuardianByIdInput } from '../../../../application/dtos/guardians/find-guardian-by-id/input.js';
import { FindGuardianByIdOutput } from '../../../../application/dtos/guardians/find-guardian-by-id/output.js';
import { GuardianMapper } from '../../../../application/mappers/guardians/guardian-mapper.js';
import { FindGuardianByIdUseCase } from '../../../../application/use-cases/guardians/find-guardian-by-id/find-guardian-by-id.usecase.js';

export class FindGuardianByIdController {
  constructor(
    private readonly useCase: FindGuardianByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindGuardianByIdOutput>> {
    const { actor } = request.context;
    const { guardianId } = request.params as unknown as FindGuardianByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.GuardianView).includes('ESCOLA');
    const item = await this.useCase.execute(
      guardianId,
      actor.id,
      seesWholeSchool ? null : actor.id,
    );

    return { statusCode: 200, body: GuardianMapper.toOutput(item) };
  }
}
