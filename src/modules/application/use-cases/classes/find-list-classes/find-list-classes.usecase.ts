import {
  IClassRepository,
  ListClassesFilters,
  ListClassesResult,
} from '../../../../domain/repositories/i-class-repository.js';

export class FindListClassesUseCase {
  constructor(private readonly classRepo: IClassRepository) {}

  execute(filters: ListClassesFilters): Promise<ListClassesResult> {
    return this.classRepo.list(filters);
  }
}
