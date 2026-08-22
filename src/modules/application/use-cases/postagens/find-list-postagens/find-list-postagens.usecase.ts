import { IPostagemRepository } from '../../../../domain/repositories/i-postagem-repository.js';
import { FindListPostagensInputDTO } from '../../../dtos/postagens/find-list-postagens/input.js';
import { FindListPostagensResult } from '../../../dtos/postagens/find-list-postagens/output.js';
import { PostagemMapper } from '../../../mappers/postagens/postagem-mapper.js';

export class FindListPostagensUseCase {
  constructor(private readonly postagemRepo: IPostagemRepository) {}

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
