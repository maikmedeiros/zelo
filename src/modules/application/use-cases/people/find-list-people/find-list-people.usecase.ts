import {
  IPersonRepository,
  ListPeopleFilters,
  ListPeopleResult,
} from '../../../../domain/repositories/i-person-repository.js';

export class FindListPeopleUseCase {
  constructor(private readonly personRepo: IPersonRepository) {}

  execute(filters: ListPeopleFilters): Promise<ListPeopleResult> {
    return this.personRepo.list(filters);
  }
}
