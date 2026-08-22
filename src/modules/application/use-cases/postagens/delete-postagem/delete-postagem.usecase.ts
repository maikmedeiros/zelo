import { NotFoundError } from '@shared/errors/index.js';
import { IPostagemRepository } from '../../../../domain/repositories/i-postagem-repository.js';

/**
 * Guard de escopo `:own` injetado por CALLBACK — é o que mantém o `authz` fora da camada
 * de aplicação. O use-case sabe *quando* checar o dono; o controller sabe *como*.
 */
export type AutorizarDono = (autorHandle: string) => void;

export class DeletePostagemUseCase {
  constructor(private readonly postagemRepo: IPostagemRepository) {}

  async execute(postagemId: string, removidoPor: string, autorizar: AutorizarDono): Promise<void> {
    const autorHandle = await this.postagemRepo.findAutorHandle(postagemId);
    if (!autorHandle) throw new NotFoundError({ message: `Postagem ${postagemId} não encontrada` });

    autorizar(autorHandle);

    const removida = await this.postagemRepo.delete(postagemId, removidoPor);

    // Perdeu a corrida com outra remoção concorrente: o resultado para o cliente é o mesmo.
    if (!removida) throw new NotFoundError({ message: `Postagem ${postagemId} não encontrada` });
  }
}
