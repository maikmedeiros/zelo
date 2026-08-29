import {
  IClassAccessRepository,
  ListClassAccessesFilters,
  ListClassAccessesResult,
} from '../../../../domain/repositories/i-class-access-repository.js';

export class FindListClassAccessesUseCase {
  constructor(private readonly accessRepo: IClassAccessRepository) {}

  execute(filters: ListClassAccessesFilters): Promise<ListClassAccessesResult> {
    return this.accessRepo.list(filters);
  }
}
