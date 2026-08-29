import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdatePersonInput,
  updatePersonParamsSchema,
} from '../../../../application/dtos/people/update-person/input.js';
import { UpdatePersonOutput } from '../../../../application/dtos/people/update-person/output.js';
import { PersonMapper } from '../../../../application/mappers/people/person-mapper.js';
import { UpdatePersonUseCase } from '../../../../application/use-cases/people/update-person/update-person.usecase.js';

export class UpdatePersonController {
  constructor(private readonly useCase: UpdatePersonUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdatePersonOutput>> {
    const { actor } = request.context;
    const { personId } = updatePersonParamsSchema.parse(request.params);
    const input = request.body as UpdatePersonInput;

    const person = await this.useCase.execute(personId, input, actor.id);

    return { statusCode: 200, body: PersonMapper.toOutput(person) };
  }
}
