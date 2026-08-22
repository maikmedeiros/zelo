import { NotFoundError, UnprocessableEntityError } from '@shared/errors/index.js';
import { IDatabaseTransaction } from '@shared/protocols/index.js';
import { IFileStorage } from '@shared/infra/storage/index.js';
import { escapeHtml } from '@shared/utils/html/index.js';
import { normalizeSpaces } from '@shared/utils/text/index.js';
import { IAlunoRepository } from '../../../../domain/repositories/i-aluno-repository.js';
import {
  IPostagemRepository,
  MidiaParaCriar,
} from '../../../../domain/repositories/i-postagem-repository.js';
import { ITurmaRepository } from '../../../../domain/repositories/i-turma-repository.js';
import { CreatePostagemInputDTO } from '../../../dtos/postagens/create-postagem/input.js';
import { CreatePostagemResult } from '../../../dtos/postagens/create-postagem/output.js';

export interface ArquivoRecebido {
  originalName: string;
  mimeType: string;
  content: Buffer;
}

const MIME_TYPES_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class CreatePostagemUseCase {
  constructor(
    private readonly postagemRepo: IPostagemRepository,
    private readonly turmaRepo: ITurmaRepository,
    private readonly alunoRepo: IAlunoRepository,
    private readonly storage: IFileStorage,
    private readonly db: IDatabaseTransaction,
  ) {}

  async execute(
    dto: CreatePostagemInputDTO,
    arquivos: ArquivoRecebido[],
    criadoPor: string,
  ): Promise<CreatePostagemResult> {
    if (!(await this.turmaRepo.exists(dto.turmaId))) {
      throw new NotFoundError({ message: `Turma ${dto.turmaId} não encontrada` });
    }

    const forasteiros = await this.alunoRepo.findIdsForaDaTurma(dto.turmaId, dto.alunoIds);
    if (forasteiros.length > 0) {
      throw new UnprocessableEntityError({
        message: 'Há alunos marcados que não estão matriculados nesta turma',
        cause: { alunoIds: forasteiros },
      });
    }

    const invalidos = arquivos.filter((arquivo) => !MIME_TYPES_PERMITIDOS.has(arquivo.mimeType));
    if (invalidos.length > 0) {
      throw new UnprocessableEntityError({
        message: 'Apenas imagens JPEG, PNG ou WebP são aceitas',
        cause: { arquivos: invalidos.map((arquivo) => arquivo.originalName) },
      });
    }

    const midias = await this.salvarArquivos(dto.turmaId, arquivos);

    return this.db.transaction(async () => {
      const criada = await this.postagemRepo.create({
        turmaId: dto.turmaId,
        titulo: normalizeSpaces(dto.titulo),
        texto: escapeHtml(dto.texto),
        criadoPor,
      });

      await this.postagemRepo.marcarAlunos(criada.id, dto.alunoIds, criadoPor);
      await this.postagemRepo.anexarMidias(criada.id, midias, criadoPor);

      return {
        id: criada.id,
        turmaId: criada.turmaId,
        titulo: criada.titulo,
        totalAlunosMarcados: dto.alunoIds.length,
        totalMidias: midias.length,
        publicadaEm: criada.publicadaEm,
      };
    });
  }

  private async salvarArquivos(
    turmaId: string,
    arquivos: ArquivoRecebido[],
  ): Promise<MidiaParaCriar[]> {
    const midias: MidiaParaCriar[] = [];

    for (const arquivo of arquivos) {
      const salvo = await this.storage.save({
        folder: `postagens/${turmaId}`,
        originalName: arquivo.originalName,
        content: arquivo.content,
        mimeType: arquivo.mimeType,
      });

      midias.push({
        caminho: salvo.storedPath,
        tipo: salvo.mimeType,
        tamanhoBytes: salvo.sizeBytes,
        hashConteudo: salvo.contentHash,
      });
    }

    return midias;
  }
}
