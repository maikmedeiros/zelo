import { NotFoundError } from '@shared/errors/index.js';
import { IPersonRepository } from '../../../../../domain/repositories/i-person-repository.js';

export class DeletePhotoUseCase {
  constructor(private readonly personRepo: IPersonRepository) {}

  async execute(personId: string, actorId: string, ownOnly: boolean): Promise<void> {
    const limpo = await this.personRepo.updatePhotoKey(personId, null, actorId, ownOnly);
    if (!limpo) throw new NotFoundError({ message: 'Pessoa não encontrada' });

    // O arquivo fica no disco de propósito. O nome é o hash do conteúdo, então a mesma imagem
    // enviada de novo reaproveita a linha — e apagar aqui quebraria qualquer outra pessoa que
    // por acaso tenha subido exatamente a mesma foto. Limpeza de órfão é trabalho de varredura.
  }
}
