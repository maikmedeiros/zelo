import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { CreateSchoolYearInput } from '../../../../application/dtos/school-years/create-school-year/input.js';
import { CreateSchoolYearOutput } from '../../../../application/dtos/school-years/create-school-year/output.js';
import { SchoolYearMapper } from '../../../../application/mappers/school-years/school-year-mapper.js';
import { CreateSchoolYearUseCase } from '../../../../application/use-cases/school-years/create-school-year/create-school-year.usecase.js';

export class CreateSchoolYearController {
  constructor(private readonly useCase: CreateSchoolYearUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<CreateSchoolYearOutput>> {
    const { actor } = request.context;
    const input = request.body as CreateSchoolYearInput;

    const schoolYear = await this.useCase.execute({
      year: input.year,
      startDate: input.startDate,
      endDate: input.endDate,
      actorId: actor.id,
    });

    return { statusCode: 201, body: SchoolYearMapper.toOutput(schoolYear) };
  }
}
