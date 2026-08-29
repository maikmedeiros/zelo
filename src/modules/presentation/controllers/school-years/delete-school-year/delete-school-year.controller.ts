import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { DeleteSchoolYearInput } from '../../../../application/dtos/school-years/delete-school-year/input.js';
import { DeleteSchoolYearUseCase } from '../../../../application/use-cases/school-years/delete-school-year/delete-school-year.usecase.js';

export class DeleteSchoolYearController {
  constructor(private readonly useCase: DeleteSchoolYearUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse> {
    const { actor } = request.context;
    const { schoolYearId } = request.params as unknown as DeleteSchoolYearInput;

    await this.useCase.execute(schoolYearId, actor.id);

    return { statusCode: 204 };
  }
}
