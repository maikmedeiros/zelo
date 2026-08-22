import { PaginatedRow } from '@shared/infra/database/index.js';
import { buildFileUrl } from '@shared/infra/storage/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { escapeHtml } from '@shared/utils/html/index.js';
import { Postagem, PostagemDetalhe } from '../../../domain/entities/postagem.js';
import { PostagemItemOutput } from '../../dtos/postagens/find-list-postagens/output.js';
import { PostagemDetalheOutput } from '../../dtos/postagens/find-postagem-by-id/output.js';

/**
 * Contrato da linha do banco: UPPER_SNAKE, o formato bruto do recordset. Mora com o mapper.
 * Query paginada → estende `PaginatedRow`.
 */
export interface PostagemPersistenceRow extends PaginatedRow {
  ID_POSTAGEM: string;
  TITULO: string;
  TEXTO: string;
  DATA_PUBLICACAO: Date;
  ID_TURMA: string;
  TURMA: string;
  HANDLE_AUTOR: string;
  AUTOR: string;
  PERFIL_AUTOR: string;
  TOTAL_MIDIA: number;
  TOTAL_ALUNO_MARCADO: number;
}

export interface MidiaPersistenceRow {
  ID_MIDIA: string;
  CAMINHO: string;
  TIPO: string;
  CAMINHO_VARIANTE: string | null;
}

export interface AlunoMarcadoPersistenceRow {
  ID_ALUNO: string;
  ALUNO: string;
}

export interface PostagemDetalhePersistenceRow {
  ID_POSTAGEM: string;
  TITULO: string;
  TEXTO: string;
  DATA_PUBLICACAO: Date;
  DATA_ATUALIZACAO: Date | null;
  ID_TURMA: string;
  TURMA: string;
  HANDLE_AUTOR: string;
  AUTOR: string;
  PERFIL_AUTOR: string;
  MIDIAS: MidiaPersistenceRow[];
  ALUNOS_MARCADOS: AlunoMarcadoPersistenceRow[];
}

/**
 * `fromPersistence` (row → entity) e `toOutput` (entity → DTO) são as ÚNICAS traduções de
 * nome do sistema: é aqui que `UUID`/`ASSUNTO` viram `id`/`titulo`. Fora do mapper, o
 * código só conhece os nomes da aplicação.
 */
export class PostagemMapper {
  static fromPersistence(row: PostagemPersistenceRow): Postagem {
    return {
      id: row.ID_POSTAGEM,
      turma: { id: row.ID_TURMA, nome: row.TURMA },
      autor: {
        handle: row.HANDLE_AUTOR,
        nome: formatPersonName(row.AUTOR),
        perfil: row.PERFIL_AUTOR,
      },
      titulo: row.TITULO,
      texto: row.TEXTO,
      totalMidias: Number(row.TOTAL_MIDIA),
      totalAlunosMarcados: Number(row.TOTAL_ALUNO_MARCADO),
      publicadaEm: new Date(row.DATA_PUBLICACAO).toISOString(),
    };
  }

  static toOutput(postagem: Postagem): PostagemItemOutput {
    return { ...postagem };
  }
}

export class PostagemDetalheMapper {
  // Recebe a `publicUrl` porque montar URL de mídia é tradução de saída, não regra de
  // negócio: a entity guarda só o caminho relativo.
  static fromPersistence(row: PostagemDetalhePersistenceRow, _publicUrl: string): PostagemDetalhe {
    return {
      id: row.ID_POSTAGEM,
      turma: { id: row.ID_TURMA, nome: row.TURMA },
      autor: {
        handle: row.HANDLE_AUTOR,
        nome: formatPersonName(row.AUTOR),
        perfil: row.PERFIL_AUTOR,
      },
      titulo: row.TITULO,
      texto: row.TEXTO,
      midias: row.MIDIAS.map((midia) => ({
        id: midia.ID_MIDIA,
        caminho: midia.CAMINHO,
        tipo: midia.TIPO,
        caminhoVariante: midia.CAMINHO_VARIANTE,
      })),
      alunosMarcados: row.ALUNOS_MARCADOS.map((aluno) => ({
        id: aluno.ID_ALUNO,
        nome: formatPersonName(aluno.ALUNO),
      })),
      publicadaEm: new Date(row.DATA_PUBLICACAO).toISOString(),
      atualizadaEm: row.DATA_ATUALIZACAO ? new Date(row.DATA_ATUALIZACAO).toISOString() : null,
    };
  }

  static toOutput(postagem: PostagemDetalhe, publicUrl: string): PostagemDetalheOutput {
    return {
      ...postagem,
      // Escape na SAÍDA além da entrada: o acervo é antigo e pode ter linha gravada antes
      // desta regra existir.
      texto: escapeHtml(postagem.texto),
      midias: postagem.midias.map((midia) => ({
        id: midia.id,
        url: buildFileUrl(publicUrl, midia.caminho),
        tipo: midia.tipo,
        urlVariante: midia.caminhoVariante ? buildFileUrl(publicUrl, midia.caminhoVariante) : null,
      })),
    };
  }
}
