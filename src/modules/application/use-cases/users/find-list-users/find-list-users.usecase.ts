import {
  IUserRepository,
  ListUsersFilters,
  ListUsersResult,
} from '../../../../domain/repositories/i-user-repository.js';

export class FindListUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  execute(filters: ListUsersFilters): Promise<ListUsersResult> {
    return this.userRepo.list(filters);
  }
}
