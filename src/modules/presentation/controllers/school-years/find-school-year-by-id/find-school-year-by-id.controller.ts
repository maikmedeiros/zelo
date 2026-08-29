import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { FindSchoolYearByIdInput } from '../../../../application/dtos/school-years/find-school-year-by-id/input.js';
import { FindSchoolYearByIdOutput } from '../../../../application/dtos/school-years/find-school-year-by-id/output.js';
import { SchoolYearMapper } from '../../../../application/mappers/school-years/school-year-mapper.js';
import { FindSchoolYearByIdUseCase } from '../../../../application/use-cases/school-years/find-school-year-by-id/find-school-year-by-id.usecase.js';

export class FindSchoolYearByIdController {
  constructor(private readonly useCase: FindSchoolYearByIdUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<FindSchoolYearByIdOutput>> {
    const { actor } = request.context;
    const { schoolYearId } = request.params as unknown as FindSchoolYearByIdInput;

    const schoolYear = await this.useCase.execute(schoolYearId, actor.id);

    return { statusCode: 200, body: SchoolYearMapper.toOutput(schoolYear) };
  }
}
