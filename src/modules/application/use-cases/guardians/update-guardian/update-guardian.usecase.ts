import { InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { Guardian } from '../../../../domain/entities/guardian.js';
import {
  IGuardianRepository,
  UpdateGuardianData,
} from '../../../../domain/repositories/i-guardian-repository.js';

export class UpdateGuardianUseCase {
  constructor(private readonly guardianRepo: IGuardianRepository) {}

  async execute(guardianId: string, data: UpdateGuardianData, actorId: string): Promise<Guardian> {
    const atual = await this.guardianRepo.findById(guardianId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Responsável não encontrado' });

    const alterado = await this.guardianRepo.update(guardianId, data);
    if (!alterado) throw new InternalServerError({ message: 'Responsável não pôde ser alterado' });

    const guardian = await this.guardianRepo.findById(guardianId, actorId, null);
    if (!guardian)
      throw new InternalServerError({ message: 'Responsável alterado mas não relido' });

    return guardian;
  }
}
