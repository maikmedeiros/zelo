import { NotFoundError } from '@shared/errors/index.js';
import { Guardian } from '../../../../domain/entities/guardian.js';
import { IGuardianRepository } from '../../../../domain/repositories/i-guardian-repository.js';

export class FindGuardianByIdUseCase {
  constructor(private readonly guardianRepo: IGuardianRepository) {}

  async execute(guardianId: string, actorId: string, viewerId: string | null): Promise<Guardian> {
    const guardian = await this.guardianRepo.findById(guardianId, actorId, viewerId);
    if (!guardian) throw new NotFoundError({ message: 'Responsável não encontrado' });

    return guardian;
  }
}
