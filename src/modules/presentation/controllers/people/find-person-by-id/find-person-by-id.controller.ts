import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindPersonByIdInput } from '../../../../application/dtos/people/find-person-by-id/input.js';
import { FindPersonByIdOutput } from '../../../../application/dtos/people/find-person-by-id/output.js';
import { PersonMapper } from '../../../../application/mappers/people/person-mapper.js';
import { FindPersonByIdUseCase } from '../../../../application/use-cases/people/find-person-by-id/find-person-by-id.usecase.js';

export class FindPersonByIdController {
  constructor(
    private readonly useCase: FindPersonByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindPersonByIdOutput>> {
    const { actor } = request.context;
    const { personId } = request.params as unknown as FindPersonByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.PersonView).includes('ESCOLA');
    const person = await this.useCase.execute(
      personId,
      actor.id,
      seesWholeSchool ? null : actor.id,
    );

    return { statusCode: 200, body: PersonMapper.toOutput(person) };
  }
}
