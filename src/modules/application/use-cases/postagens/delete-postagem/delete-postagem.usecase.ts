import { NotFoundError } from '@shared/errors/index.js';
import { IPostagemRepository } from '../../../../domain/repositories/i-postagem-repository.js';

export type AutorizarDono = (autorHandle: string) => void;

export class DeletePostagemUseCase {
  constructor(private readonly postagemRepo: IPostagemRepository) {}

  async execute(postagemId: string, removidoPor: string, autorizar: AutorizarDono): Promise<void> {
    const autorHandle = await this.postagemRepo.findAutorHandle(postagemId);
    if (!autorHandle) throw new NotFoundError({ message: `Postagem ${postagemId} não encontrada` });

    autorizar(autorHandle);

    const removida = await this.postagemRepo.delete(postagemId, removidoPor);

    if (!removida) throw new NotFoundError({ message: `Postagem ${postagemId} não encontrada` });
  }
}
