import { NotFoundError } from '@shared/errors/index.js';
import { Person } from '../../../../domain/entities/person.js';
import { IPersonRepository } from '../../../../domain/repositories/i-person-repository.js';

export class FindPersonByIdUseCase {
  constructor(private readonly personRepo: IPersonRepository) {}

  async execute(personId: string, actorId: string, viewerId: string | null): Promise<Person> {
    const person = await this.personRepo.findById(personId, actorId, viewerId);
    if (!person) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    return person;
  }
}
