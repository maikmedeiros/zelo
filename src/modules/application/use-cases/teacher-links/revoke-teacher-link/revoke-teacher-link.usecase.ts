import { ConflictError, NotFoundError } from '@shared/errors/index.js';
import { ITeacherLinkRepository } from '../../../../domain/repositories/i-teacher-link-repository.js';

export class RevokeTeacherLinkUseCase {
  constructor(private readonly linkRepo: ITeacherLinkRepository) {}

  async execute(linkId: string, actorId: string): Promise<void> {
    const link = await this.linkRepo.findById(linkId, actorId, null);
    if (!link) throw new NotFoundError({ message: 'Vínculo não encontrado' });

    // Encerrar o vínculo tira o escopo de leitura, mas não a autoria: as postagens que este
    // professor escreveu continuam visíveis para ele pelo ramo de autoria de `visivelParaAtor`.
    const encerrado = await this.linkRepo.revoke(linkId);
    if (!encerrado) {
      throw new ConflictError({
        message: 'Vínculo já encerrado',
        cause: { endDate: link.endDate },
      });
    }
  }
}
