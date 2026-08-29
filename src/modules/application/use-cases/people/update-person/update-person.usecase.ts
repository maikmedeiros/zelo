import { ConflictError, InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Person } from '../../../../domain/entities/person.js';
import {
  IPersonRepository,
  UpdatePersonData,
} from '../../../../domain/repositories/i-person-repository.js';

export class UpdatePersonUseCase {
  constructor(private readonly personRepo: IPersonRepository) {}

  async execute(personId: string, data: UpdatePersonData, actorId: string): Promise<Person> {
    // `viewerId` null: quem tem UPDATE:PERSON corrige cadastro da escola, e exigir vínculo
    // aqui esconderia da secretaria a pessoa que ela mesma acabou de criar.
    const atual = await this.personRepo.findById(personId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    // Já existe (o findById passou), então zero linhas aqui é colisão de `uq_pessoa_cpf`.
    const alterado = await this.personRepo.update(personId, data);
    if (!alterado) {
      const existingId = data.cpf ? await this.personRepo.findIdByCpf(data.cpf, actorId) : null;

      throw new ConflictError({
        message: 'Já existe uma pessoa com este CPF',
        cause: { cpf: data.cpf, personId: existingId },
      });
    }

    const person = await this.personRepo.findById(personId, actorId, null);
    if (!person) throw new InternalServerError({ message: 'Pessoa alterada mas não relida' });

    return person;
  }
}
