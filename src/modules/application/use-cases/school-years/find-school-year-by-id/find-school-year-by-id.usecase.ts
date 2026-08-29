import { NotFoundError } from '@shared/errors/index.js';
import { SchoolYear } from '../../../../domain/entities/school-year.js';
import { ISchoolYearRepository } from '../../../../domain/repositories/i-school-year-repository.js';

export class FindSchoolYearByIdUseCase {
  constructor(private readonly schoolYearRepo: ISchoolYearRepository) {}

  async execute(schoolYearId: string, actorId: string): Promise<SchoolYear> {
    const schoolYear = await this.schoolYearRepo.findById(schoolYearId, actorId);
    if (!schoolYear) throw new NotFoundError({ message: 'Ano letivo não encontrado' });

    return schoolYear;
  }
}
