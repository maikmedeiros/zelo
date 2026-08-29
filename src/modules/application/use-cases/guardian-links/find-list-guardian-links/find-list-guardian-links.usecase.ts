import {
  IGuardianLinkRepository,
  ListGuardianLinksFilters,
  ListGuardianLinksResult,
} from '../../../../domain/repositories/i-guardian-link-repository.js';

export class FindListGuardianLinksUseCase {
  constructor(private readonly linkRepo: IGuardianLinkRepository) {}

  execute(filters: ListGuardianLinksFilters): Promise<ListGuardianLinksResult> {
    return this.linkRepo.list(filters);
  }
}
