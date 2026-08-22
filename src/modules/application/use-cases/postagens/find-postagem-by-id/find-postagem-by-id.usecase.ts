import { NotFoundError } from '@shared/errors/index.js';
import { IPostagemRepository } from '../../../../domain/repositories/i-postagem-repository.js';
import { PostagemDetalheOutput } from '../../../dtos/postagens/find-postagem-by-id/output.js';
import { PostagemDetalheMapper } from '../../../mappers/postagens/postagem-mapper.js';

export class FindPostagemByIdUseCase {
  constructor(
    private readonly postagemRepo: IPostagemRepository,
    private readonly publicUrl: string,
  ) {}

  async execute(postagemId: string, audienciaHandle?: string): Promise<PostagemDetalheOutput> {
    const postagem = await this.postagemRepo.findById(postagemId, audienciaHandle);

    // 404, não 403: a existência de uma postagem de outra turma é informação que o ator
    // fora da audiência não deve conseguir inferir.
    if (!postagem) throw new NotFoundError({ message: `Postagem ${postagemId} não encontrada` });

    return PostagemDetalheMapper.toOutput(postagem, this.publicUrl);
  }
}
