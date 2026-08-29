import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateClassInput,
  updateClassParamsSchema,
} from '../../../../application/dtos/classes/update-class/input.js';
import { UpdateClassOutput } from '../../../../application/dtos/classes/update-class/output.js';
import { ClassMapper } from '../../../../application/mappers/classes/class-mapper.js';
import { UpdateClassUseCase } from '../../../../application/use-cases/classes/update-class/update-class.usecase.js';

export class UpdateClassController {
  constructor(private readonly useCase: UpdateClassUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateClassOutput>> {
    const { actor } = request.context;
    const { classId } = updateClassParamsSchema.parse(request.params);
    const input = request.body as UpdateClassInput;

    const turma = await this.useCase.execute(classId, input, actor.id);

    return { statusCode: 200, body: ClassMapper.toOutput(turma) };
  }
}
