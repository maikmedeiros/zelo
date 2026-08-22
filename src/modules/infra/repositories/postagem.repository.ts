import { PostgresDatabase } from '@shared/infra/database/index.js';
import { emptyPagination, paginationFromRow } from '@shared/infra/database/index.js';
import { PostagemCriada, PostagemDetalhe } from '../../domain/entities/postagem.js';
import {
  CreatePostagemData,
  IPostagemRepository,
  ListPostagensFilters,
  ListPostagensResult,
  MidiaParaCriar,
  PaginationParams,
} from '../../domain/repositories/i-postagem-repository.js';
import {
  PostagemDetalheMapper,
  PostagemDetalhePersistenceRow,
  PostagemMapper,
  PostagemPersistenceRow,
} from '../../application/mappers/postagens/postagem-mapper.js';

/**
 * ISOLAMENTO DE AUDIÊNCIA — o requisito de segurança mais crítico do sistema.
 *
 * A CTE resolve, num único lugar, quais turmas um `handle` pode enxergar: turma de filho
 * matriculado (responsável) ou turma atribuída (professor). Toda consulta de postagem
 * passa por ela. Duplicar essa regra em outra query é o caminho para um vazamento — se
 * precisar dela em outro agregado, extraia para uma VIEW no banco, não copie o texto.
 *
 * A segunda linha de defesa é a Row Level Security do próprio PostgreSQL
 * (ver `db/migrations/002_rls.sql`).
 */
const CTE_TURMA_VISIVEL = `
  WITH turma_visivel AS (
    SELECT m.turma_id
    FROM usuario u
    INNER JOIN responsavel_aluno ra ON ra.responsavel_id = u.id
    INNER JOIN matricula m ON m.aluno_id = ra.aluno_id AND m.ativa = true
    WHERE u.handle = @audienciaHandle AND u.ativo = true
    UNION
    SELECT tp.turma_id
    FROM usuario u
    INNER JOIN turma_professor tp ON tp.professor_id = u.id
    WHERE u.handle = @audienciaHandle AND u.ativo = true
  )
`;

const SELECT_LIST = `
  ${CTE_TURMA_VISIVEL},
  filtrada AS (
    SELECT
      p.id,
      p.titulo,
      p.texto,
      p.publicada_em,
      t.id   AS turma_id,
      t.nome AS turma_nome,
      a.handle AS autor_handle,
      a.nome   AS autor_nome,
      a.perfil AS autor_perfil,
      (SELECT count(*) FROM postagem_midia pm WHERE pm.postagem_id = p.id) AS total_midias,
      (SELECT count(*) FROM postagem_aluno pa WHERE pa.postagem_id = p.id) AS total_alunos,
      count(*) OVER () AS total_registro
    FROM postagem p
    INNER JOIN turma t   ON t.id = p.turma_id
    INNER JOIN usuario a ON a.handle = p.criado_por
    WHERE p.removida_em IS NULL
      AND (@audienciaHandle::text IS NULL OR p.turma_id IN (SELECT turma_id FROM turma_visivel))
      AND (@turmaIds::uuid[] IS NULL OR p.turma_id = ANY (@turmaIds::uuid[]))
      AND (@alunoId::uuid IS NULL
           OR EXISTS (SELECT 1 FROM postagem_aluno pa
                      WHERE pa.postagem_id = p.id AND pa.aluno_id = @alunoId::uuid))
      AND (@publicadaDe::timestamptz IS NULL OR p.publicada_em >= @publicadaDe::timestamptz)
      AND (@publicadaAte::timestamptz IS NULL OR p.publicada_em <= @publicadaAte::timestamptz)
    ORDER BY p.publicada_em DESC, p.id DESC
    OFFSET (@page::int - 1) * @limit::int
    LIMIT @limit::int
  )
  SELECT
    f.id::text                        AS "ID_POSTAGEM",
    f.titulo                          AS "TITULO",
    f.texto                           AS "TEXTO",
    f.publicada_em                    AS "DATA_PUBLICACAO",
    f.turma_id::text                  AS "ID_TURMA",
    f.turma_nome                      AS "TURMA",
    f.autor_handle                    AS "HANDLE_AUTOR",
    f.autor_nome                      AS "AUTOR",
    f.autor_perfil                    AS "PERFIL_AUTOR",
    f.total_midias::int               AS "TOTAL_MIDIA",
    f.total_alunos::int               AS "TOTAL_ALUNO_MARCADO",
    @page::int                        AS "PAGINA_ATUAL",
    @limit::int                       AS "LIMITE_PAGINA",
    f.total_registro::int             AS "TOTAL_REGISTRO",
    ceil(f.total_registro::numeric / @limit::int)::int AS "TOTAL_PAGINA"
  FROM filtrada f
  ORDER BY f.publicada_em DESC, f.id DESC;
`;

const SELECT_BY_ID = `
  ${CTE_TURMA_VISIVEL}
  SELECT
    p.id::text        AS "ID_POSTAGEM",
    p.titulo          AS "TITULO",
    p.texto           AS "TEXTO",
    p.publicada_em    AS "DATA_PUBLICACAO",
    p.atualizada_em   AS "DATA_ATUALIZACAO",
    t.id::text        AS "ID_TURMA",
    t.nome            AS "TURMA",
    a.handle          AS "HANDLE_AUTOR",
    a.nome            AS "AUTOR",
    a.perfil          AS "PERFIL_AUTOR",
    COALESCE(
      (SELECT json_agg(json_build_object(
                'ID_MIDIA', pm.id::text,
                'CAMINHO', pm.caminho,
                'TIPO', pm.tipo_mime,
                'CAMINHO_VARIANTE', pm.caminho_variante)
              ORDER BY pm.ordem, pm.id)
       FROM postagem_midia pm WHERE pm.postagem_id = p.id),
      '[]'::json) AS "MIDIAS",
    COALESCE(
      (SELECT json_agg(json_build_object('ID_ALUNO', al.id::text, 'ALUNO', al.nome)
              ORDER BY al.nome)
       FROM postagem_aluno pa
       INNER JOIN aluno al ON al.id = pa.aluno_id
       WHERE pa.postagem_id = p.id),
      '[]'::json) AS "ALUNOS_MARCADOS"
  FROM postagem p
  INNER JOIN turma t   ON t.id = p.turma_id
  INNER JOIN usuario a ON a.handle = p.criado_por
  WHERE p.id = @id::uuid
    AND p.removida_em IS NULL
    AND (@audienciaHandle::text IS NULL OR p.turma_id IN (SELECT turma_id FROM turma_visivel));
`;

// `RETURNING` reprojeta a linha criada — segue o fluxo padrão row → fromPersistence.
const INSERT_POSTAGEM = `
  INSERT INTO postagem (turma_id, titulo, texto, criado_por)
  VALUES (@turmaId::uuid, @titulo, @texto, @criadoPor)
  RETURNING
    id::text       AS "ID_POSTAGEM",
    turma_id::text AS "ID_TURMA",
    titulo         AS "TITULO",
    publicada_em   AS "DATA_PUBLICACAO";
`;

// `unnest` mantém a escrita em UMA sentença: N alunos marcados, um round-trip.
const INSERT_POSTAGEM_ALUNO = `
  INSERT INTO postagem_aluno (postagem_id, aluno_id, criado_por)
  SELECT @postagemId::uuid, id, @criadoPor
  FROM unnest(@alunoIds::uuid[]) AS id
  ON CONFLICT (postagem_id, aluno_id) DO NOTHING;
`;

const INSERT_POSTAGEM_MIDIA = `
  INSERT INTO postagem_midia
    (postagem_id, caminho, tipo_mime, tamanho_bytes, hash_conteudo, ordem, criado_por)
  SELECT
    @postagemId::uuid, m.caminho, m.tipo_mime, m.tamanho_bytes, m.hash_conteudo,
    m.ordem::int, @criadoPor
  FROM json_to_recordset(@midias::json) AS m(
    caminho text, tipo_mime text, tamanho_bytes bigint, hash_conteudo text, ordem int
  );
`;

const SELECT_AUTOR_HANDLE = `
  SELECT criado_por AS "HANDLE_AUTOR"
  FROM postagem
  WHERE id = @id::uuid AND removida_em IS NULL;
`;

// Soft delete: o acervo é prova de conformidade, apagar linha destrói a trilha.
const SOFT_DELETE_POSTAGEM = `
  UPDATE postagem
  SET removida_em = now(), removida_por = @removidoPor
  WHERE id = @id::uuid AND removida_em IS NULL
  RETURNING id::text AS "ID_POSTAGEM";
`;

export class PostagemRepository implements IPostagemRepository {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly publicUrl: string,
  ) {}

  async list(
    filters: ListPostagensFilters,
    pagination: PaginationParams,
  ): Promise<ListPostagensResult> {
    const rows = await this.db.query<PostagemPersistenceRow>(SELECT_LIST, {
      page: pagination.page,
      limit: pagination.limit,
      // Ausência → null EXPLÍCITO. `undefined` chegaria ao driver como parâmetro faltando.
      audienciaHandle: filters.audienciaHandle ?? null,
      turmaIds: filters.turmaIds ?? null,
      alunoId: filters.alunoId ?? null,
      publicadaDe: filters.publicadaDe ?? null,
      publicadaAte: filters.publicadaAte ?? null,
    });

    if (rows.length === 0) {
      return { data: [], pagination: emptyPagination(pagination.page, pagination.limit) };
    }

    return {
      data: rows.map(PostagemMapper.fromPersistence),
      pagination: paginationFromRow(rows[0]!),
    };
  }

  async findById(id: string, audienciaHandle?: string): Promise<PostagemDetalhe | null> {
    const rows = await this.db.query<PostagemDetalhePersistenceRow>(SELECT_BY_ID, {
      id,
      audienciaHandle: audienciaHandle ?? null,
    });

    if (rows.length === 0) return null;
    return PostagemDetalheMapper.fromPersistence(rows[0]!, this.publicUrl);
  }

  async create(data: CreatePostagemData): Promise<PostagemCriada> {
    const rows = await this.db.query<{
      ID_POSTAGEM: string;
      ID_TURMA: string;
      TITULO: string;
      DATA_PUBLICACAO: Date;
    }>(INSERT_POSTAGEM, {
      turmaId: data.turmaId,
      titulo: data.titulo,
      texto: data.texto,
      criadoPor: data.criadoPor,
    });

    const row = rows[0]!;
    return {
      id: row.ID_POSTAGEM,
      turmaId: row.ID_TURMA,
      titulo: row.TITULO,
      publicadaEm: new Date(row.DATA_PUBLICACAO).toISOString(),
    };
  }

  async marcarAlunos(postagemId: string, alunoIds: string[], criadoPor: string): Promise<void> {
    if (alunoIds.length === 0) return;
    await this.db.query(INSERT_POSTAGEM_ALUNO, { postagemId, alunoIds, criadoPor });
  }

  async anexarMidias(
    postagemId: string,
    midias: MidiaParaCriar[],
    criadoPor: string,
  ): Promise<void> {
    if (midias.length === 0) return;

    await this.db.query(INSERT_POSTAGEM_MIDIA, {
      postagemId,
      criadoPor,
      midias: JSON.stringify(
        midias.map((midia, ordem) => ({
          caminho: midia.caminho,
          tipo_mime: midia.tipo,
          tamanho_bytes: midia.tamanhoBytes,
          hash_conteudo: midia.hashConteudo,
          ordem,
        })),
      ),
    });
  }

  async findAutorHandle(id: string): Promise<string | null> {
    const rows = await this.db.query<{ HANDLE_AUTOR: string }>(SELECT_AUTOR_HANDLE, { id });
    return rows[0]?.HANDLE_AUTOR ?? null;
  }

  async delete(id: string, removidoPor: string): Promise<boolean> {
    const rows = await this.db.query<{ ID_POSTAGEM: string }>(SOFT_DELETE_POSTAGEM, {
      id,
      removidoPor,
    });

    // `RETURNING` vazio ⇒ a linha não existia (ou já estava removida). O `infra` só relata
    // o fato; quem traduz em 404 é o use-case, dono da regra.
    return rows.length > 0;
  }
}
