import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListRolesSchema } from '../../../../application/dtos/roles/find-list-roles/input.js';
import { FindListRolesOutput } from '../../../../application/dtos/roles/find-list-roles/output.js';
import { RoleMapper } from '../../../../application/mappers/roles/role-mapper.js';
import { FindListRolesUseCase } from '../../../../application/use-cases/roles/find-list-roles/find-list-roles.usecase.js';

export class FindListRolesController {
  constructor(private readonly useCase: FindListRolesUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListRolesOutput>>> {
    const { actor } = request.context;
    const query = findListRolesSchema.parse(request.query);

    // Perfil é configuração da escola, não conteúdo de turma: quem tem `VIEW:ROLE` enxerga o
    // catálogo inteiro da própria escola. Não há recorte por abrangência a aplicar.
    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search ?? null,
      actorId: actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(RoleMapper.toOutput), pagination) };
  }
}
