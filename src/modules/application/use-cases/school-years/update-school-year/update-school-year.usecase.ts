import {
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from '@shared/errors/index.js';
import { SchoolYear } from '../../../../domain/entities/school-year.js';
import {
  ISchoolYearRepository,
  UpdateSchoolYearData,
} from '../../../../domain/repositories/i-school-year-repository.js';

export class UpdateSchoolYearUseCase {
  constructor(private readonly schoolYearRepo: ISchoolYearRepository) {}

  async execute(
    schoolYearId: string,
    data: UpdateSchoolYearData,
    actorId: string,
  ): Promise<SchoolYear> {
    const atual = await this.schoolYearRepo.findById(schoolYearId, actorId);
    if (!atual) throw new NotFoundError({ message: 'Ano letivo não encontrado' });

    // O PATCH pode trazer só uma das datas, então a ordem só pode ser conferida contra o
    // valor já gravado. O CHECK `ano_letivo_periodo` faria isso — mas como 500.
    const startDate = data.startDate ?? atual.startDate;
    const endDate = data.endDate ?? atual.endDate;

    if (endDate <= startDate) {
      throw new UnprocessableEntityError({
        message: 'endDate precisa ser posterior a startDate',
        cause: { startDate, endDate },
      });
    }

    // Já existe (o findById passou), então zero linhas aqui é colisão de `uq_ano_letivo`.
    const alterado = await this.schoolYearRepo.update(schoolYearId, data);
    if (!alterado) {
      throw new ConflictError({
        message: `O ano letivo ${String(data.year)} já existe nesta escola`,
      });
    }

    const schoolYear = await this.schoolYearRepo.findById(schoolYearId, actorId);
    if (!schoolYear)
      throw new InternalServerError({ message: 'Ano letivo alterado mas não relido' });

    return schoolYear;
  }
}
