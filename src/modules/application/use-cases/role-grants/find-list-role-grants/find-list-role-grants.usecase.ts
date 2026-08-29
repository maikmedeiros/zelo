import {
  IRoleGrantRepository,
  ListRoleGrantsFilters,
  ListRoleGrantsResult,
} from '../../../../domain/repositories/i-role-grant-repository.js';

export class FindListRoleGrantsUseCase {
  constructor(private readonly grantRepo: IRoleGrantRepository) {}

  execute(filters: ListRoleGrantsFilters): Promise<ListRoleGrantsResult> {
    return this.grantRepo.list(filters);
  }
}
