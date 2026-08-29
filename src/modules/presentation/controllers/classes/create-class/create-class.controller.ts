import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateClassInput } from '../../../../application/dtos/classes/create-class/input.js';
import { CreateClassOutput } from '../../../../application/dtos/classes/create-class/output.js';
import { ClassMapper } from '../../../../application/mappers/classes/class-mapper.js';
import { CreateClassUseCase } from '../../../../application/use-cases/classes/create-class/create-class.usecase.js';

export class CreateClassController {
  constructor(private readonly useCase: CreateClassUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateClassOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateClassInput;

    const turma = await this.useCase.execute({
      schoolYearId: input.schoolYearId,
      name: input.name,
      segment: input.segment,
      shift: input.shift,
      actorId: actor.id,
    });

    return { statusCode: 201, body: ClassMapper.toOutput(turma) };
  }
}
