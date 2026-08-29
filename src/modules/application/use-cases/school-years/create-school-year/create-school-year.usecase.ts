import { ConflictError, InternalServerError } from '@shared/errors/index.js';
import { SchoolYear } from '../../../../domain/entities/school-year.js';
import {
  CreateSchoolYearData,
  ISchoolYearRepository,
} from '../../../../domain/repositories/i-school-year-repository.js';

export class CreateSchoolYearUseCase {
  constructor(private readonly schoolYearRepo: ISchoolYearRepository) {}

  async execute(data: CreateSchoolYearData): Promise<SchoolYear> {
    const schoolYearId = await this.schoolYearRepo.create(data);

    // Recordset vazio é o `ON CONFLICT DO NOTHING` recusando a linha: o ano já existe na
    // escola. `uq_ano_letivo` é a única razão possível.
    if (!schoolYearId) {
      throw new ConflictError({ message: `O ano letivo ${data.year} já existe nesta escola` });
    }

    const schoolYear = await this.schoolYearRepo.findById(schoolYearId, data.actorId);
    if (!schoolYear)
      throw new InternalServerError({ message: 'Ano letivo gravado mas não relido' });

    return schoolYear;
  }
}
