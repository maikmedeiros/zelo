import {
  ISchoolYearRepository,
  ListSchoolYearsFilters,
  ListSchoolYearsResult,
} from '../../../../domain/repositories/i-school-year-repository.js';

export class FindListSchoolYearsUseCase {
  constructor(private readonly schoolYearRepo: ISchoolYearRepository) {}

  execute(filters: ListSchoolYearsFilters): Promise<ListSchoolYearsResult> {
    return this.schoolYearRepo.list(filters);
  }
}
