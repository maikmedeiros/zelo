import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { IGuardianLinkRepository } from '../../../../domain/repositories/i-guardian-link-repository.js';

export class RevokeGuardianLinkUseCase {
  constructor(private readonly linkRepo: IGuardianLinkRepository) {}

  async execute(linkId: string, actorId: string): Promise<void> {
    const link = await this.linkRepo.findById(linkId, actorId, null);
    if (!link) throw new NotFoundError({ message: 'Vínculo não encontrado' });

    // Encerrar, não apagar: o consentimento assinado por este responsável continua tendo de
    // apontar para o vínculo que o autorizava na data em que foi dado.
    const encerrado = await this.linkRepo.revoke(linkId);
    if (!encerrado) {
      throw new ConflictError({
        message: 'Vínculo já encerrado',
        cause: { endDate: link.endDate },
      });
    }
  }
}
