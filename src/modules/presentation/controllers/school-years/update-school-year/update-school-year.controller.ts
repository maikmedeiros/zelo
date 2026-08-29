import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import {
  UpdateSchoolYearInput,
  updateSchoolYearParamsSchema,
} from '../../../../application/dtos/school-years/update-school-year/input.js';
import { UpdateSchoolYearOutput } from '../../../../application/dtos/school-years/update-school-year/output.js';
import { SchoolYearMapper } from '../../../../application/mappers/school-years/school-year-mapper.js';
import { UpdateSchoolYearUseCase } from '../../../../application/use-cases/school-years/update-school-year/update-school-year.usecase.js';

export class UpdateSchoolYearController {
  constructor(private readonly useCase: UpdateSchoolYearUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<UpdateSchoolYearOutput>> {
    const { actor } = request.context;
    const { schoolYearId } = updateSchoolYearParamsSchema.parse(request.params);
    const input = request.body as UpdateSchoolYearInput;

    const schoolYear = await this.useCase.execute(schoolYearId, input, actor.id);

    return { statusCode: 200, body: SchoolYearMapper.toOutput(schoolYear) };
  }
}
