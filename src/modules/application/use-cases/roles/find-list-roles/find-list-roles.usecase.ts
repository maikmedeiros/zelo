import {
  IRoleRepository,
  ListRolesFilters,
  ListRolesResult,
} from '../../../../domain/repositories/i-role-repository.js';

export class FindListRolesUseCase {
  constructor(private readonly roleRepo: IRoleRepository) {}

  execute(filters: ListRolesFilters): Promise<ListRolesResult> {
    return this.roleRepo.list(filters);
  }
}
