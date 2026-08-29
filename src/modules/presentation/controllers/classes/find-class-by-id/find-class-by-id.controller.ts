import { Feature } from '@config/features.js';
import { Actor, Scope } from '@shared/auth/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindClassByIdInput } from '../../../../application/dtos/classes/find-class-by-id/input.js';
import { FindClassByIdOutput } from '../../../../application/dtos/classes/find-class-by-id/output.js';
import { ClassMapper } from '../../../../application/mappers/classes/class-mapper.js';
import { FindClassByIdUseCase } from '../../../../application/use-cases/classes/find-class-by-id/find-class-by-id.usecase.js';

export class FindClassByIdController {
  constructor(
    private readonly useCase: FindClassByIdUseCase,
    private readonly scopesOf: (actor: Actor, feature: string) => Scope[],
  ) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindClassByIdOutput>> {
    const { actor } = request.context;
    const { classId } = request.params as unknown as FindClassByIdInput;

    const seesWholeSchool = this.scopesOf(actor, Feature.ClassView).includes('ESCOLA');
    const turma = await this.useCase.execute(classId, actor.id, seesWholeSchool ? null : actor.id);

    return { statusCode: 200, body: ClassMapper.toOutput(turma) };
  }
}
