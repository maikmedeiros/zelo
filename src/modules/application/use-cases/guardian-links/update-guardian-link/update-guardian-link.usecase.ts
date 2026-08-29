import { InternalServerError, NotFoundError } from '@shared/errors/index.js';
import { GuardianLink } from '../../../../domain/entities/guardian-link.js';
import {
  IGuardianLinkRepository,
  UpdateGuardianLinkData,
} from '../../../../domain/repositories/i-guardian-link-repository.js';

export class UpdateGuardianLinkUseCase {
  constructor(private readonly linkRepo: IGuardianLinkRepository) {}

  async execute(
    linkId: string,
    data: UpdateGuardianLinkData,
    actorId: string,
  ): Promise<GuardianLink> {
    const atual = await this.linkRepo.findById(linkId, actorId, null);
    if (!atual) throw new NotFoundError({ message: 'Vínculo não encontrado' });

    const alterado = await this.linkRepo.update(linkId, data);
    if (!alterado) throw new InternalServerError({ message: 'Vínculo não pôde ser alterado' });

    const link = await this.linkRepo.findById(linkId, actorId, null);
    if (!link) throw new InternalServerError({ message: 'Vínculo alterado mas não relido' });

    return link;
  }
}
