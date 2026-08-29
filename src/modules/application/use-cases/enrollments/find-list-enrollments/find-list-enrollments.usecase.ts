import {
  IEnrollmentRepository,
  ListEnrollmentsFilters,
  ListEnrollmentsResult,
} from '../../../../domain/repositories/i-enrollment-repository.js';

export class FindListEnrollmentsUseCase {
  constructor(private readonly enrollmentRepo: IEnrollmentRepository) {}

  execute(filters: ListEnrollmentsFilters): Promise<ListEnrollmentsResult> {
    return this.enrollmentRepo.list(filters);
  }
}
