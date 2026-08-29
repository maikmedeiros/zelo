import { Paginated, paginated } from '@shared/presenters/index.js';
import { IHttpRequest, IHttpResponse } from '@shared/protocols/index.js';
import { findListRoleGrantsSchema } from '../../../../application/dtos/role-grants/find-list-role-grants/input.js';
import { FindListRoleGrantsOutput } from '../../../../application/dtos/role-grants/find-list-role-grants/output.js';
import { RoleGrantMapper } from '../../../../application/mappers/role-grants/role-grant-mapper.js';
import { FindListRoleGrantsUseCase } from '../../../../application/use-cases/role-grants/find-list-role-grants/find-list-role-grants.usecase.js';

export class FindListRoleGrantsController {
  constructor(private readonly useCase: FindListRoleGrantsUseCase) {}

  async handle(request: IHttpRequest): Promise<IHttpResponse<Paginated<FindListRoleGrantsOutput>>> {
    const { actor } = request.context;
    const query = findListRoleGrantsSchema.parse(request.query);

    const { items, pagination } = await this.useCase.execute({
      page: query.page,
      limit: query.limit,
      userId: query.userId ?? null,
      roleId: query.roleId ?? null,
      active: query.active ?? null,
      actorId: actor.id,
    });

    return { statusCode: 200, body: paginated(items.map(RoleGrantMapper.toOutput), pagination) };
  }
}
