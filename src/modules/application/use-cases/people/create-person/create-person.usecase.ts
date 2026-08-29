import { ConflictError, InternalServerError } from '@shared/errors/index.js';
import { Person } from '../../../../domain/entities/person.js';
import {
  CreatePersonData,
  IPersonRepository,
} from '../../../../domain/repositories/i-person-repository.js';

export class CreatePersonUseCase {
  constructor(private readonly personRepo: IPersonRepository) {}

  async execute(data: CreatePersonData): Promise<Person> {
    const personId = await this.personRepo.create(data);

    // Recordset vazio é o `uq_pessoa_cpf` recusando a linha. O 409 devolve o id de quem já
    // tem o CPF: é a resposta que o operador precisa para dar o segundo papel à pessoa que
    // já existe, em vez de tentar cadastrá-la de novo.
    if (!personId) {
      const existingId = data.cpf
        ? await this.personRepo.findIdByCpf(data.cpf, data.actorId)
        : null;

      throw new ConflictError({
        message: 'Já existe uma pessoa com este CPF',
        cause: { cpf: data.cpf, personId: existingId },
      });
    }

    // `viewerId` null: quem acabou de cadastrar ainda não tem vínculo com a pessoa nova, e o
    // recorte de leitura a esconderia de quem a criou.
    const person = await this.personRepo.findById(personId, data.actorId, null);
    if (!person) throw new InternalServerError({ message: 'Pessoa gravada mas não relida' });

    return person;
  }
}
