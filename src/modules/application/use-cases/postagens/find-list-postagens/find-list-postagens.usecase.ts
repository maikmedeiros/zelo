import { IPostagemRepository } from '../../../../domain/repositories/i-postagem-repository.js';
import { FindListPostagensInputDTO } from '../../../dtos/postagens/find-list-postagens/input.js';
import { FindListPostagensResult } from '../../../dtos/postagens/find-list-postagens/output.js';
import { PostagemMapper } from '../../../mappers/postagens/postagem-mapper.js';

export class FindListPostagensUseCase {
  constructor(private readonly postagemRepo: IPostagemRepository) {}

  /**
   * `audienciaHandle` vem `undefined` só quando o ator tem a capability no escopo `:any`.
   * Quem decide isso é o controller — o use-case não conhece autorização, só propaga o
   * recorte de audiência para o repositório.
   */
  async execute(
    dto: FindListPostagensInputDTO,
    audienciaHandle?: string,
  ): Promise<FindListPostagensResult> {
    const { data, pagination } = await this.postagemRepo.list(
      {
        turmaIds: dto.turmaIds,
        alunoId: dto.alunoId,
        publicadaDe: dto.publicadaDe,
        publicadaAte: dto.publicadaAte,
        audienciaHandle,
      },
      { page: dto.page, limit: dto.limit },
    );

    return { items: data.map(PostagemMapper.toOutput), pagination };
  }
}
