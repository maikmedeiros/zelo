import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListSchoolYearsSchema } from '../../../../application/dtos/school-years/find-list-school-years/input.js';
import { FindListSchoolYearsOutput } from '../../../../application/dtos/school-years/find-list-school-years/output.js';
import { SchoolYearMapper } from '../../../../application/mappers/school-years/school-year-mapper.js';
import { FindListSchoolYearsUseCase } from '../../../../application/use-cases/school-years/find-list-school-years/find-list-school-years.usecase.js';

export class FindListSchoolYearsController {
  constructor(private readonly useCase: FindListSchoolYearsUseCase) {}

  async handle(
    request: IHttpRequest,
  ): Promise<IHttpResponse<Paginated<FindListSchoolYearsOutput>>> {
    const { actor } = request.context;
    const query = findListSchoolYearsSchema.parse(request.query);

    // Ano letivo é cadastro: quem tem VIEW:SCHOOL_YEAR enxerga os da própria escola, e a
    // escola sai do ator dentro do SQL. Não há recorte por turma a aplicar aqui.
    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      year: query.year ?? null,
      actorId: actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(SchoolYearMapper.toOutput), pagination) };
  }
}
