import {
  IGuardianRepository,
  ListGuardiansFilters,
  ListGuardiansResult,
} from '../../../../domain/repositories/i-guardian-repository.js';

export class FindListGuardiansUseCase {
  constructor(private readonly guardianRepo: IGuardianRepository) {}

  execute(filters: ListGuardiansFilters): Promise<ListGuardiansResult> {
    return this.guardianRepo.list(filters);
  }
}
