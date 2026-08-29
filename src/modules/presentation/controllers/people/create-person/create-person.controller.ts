import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreatePersonInput } from '../../../../application/dtos/people/create-person/input.js';
import { CreatePersonOutput } from '../../../../application/dtos/people/create-person/output.js';
import { PersonMapper } from '../../../../application/mappers/people/person-mapper.js';
import { CreatePersonUseCase } from '../../../../application/use-cases/people/create-person/create-person.usecase.js';

export class CreatePersonController {
  constructor(private readonly useCase: CreatePersonUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreatePersonOutput>> {
    const { actor } = request.context;
    const input = request.body as CreatePersonInput;

    const person = await this.useCase.execute({
      name: input.name,
      socialName: input.socialName,
      birthDate: input.birthDate,
      cpf: input.cpf,
      phone: input.phone,
      contactEmail: input.contactEmail,
      actorId: actor.id,
    });

    return { statusCode: 201, body: PersonMapper.toOutput(person) };
  }
}
