import {
  IStudentRepository,
  ListStudentsFilters,
  ListStudentsResult,
} from '../../../../domain/repositories/i-student-repository.js';

export class FindListStudentsUseCase {
  constructor(private readonly studentRepo: IStudentRepository) {}

  execute(filters: ListStudentsFilters): Promise<ListStudentsResult> {
    return this.studentRepo.list(filters);
  }
}
