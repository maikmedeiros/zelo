import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Post, PostOwnership } from '../../domain/entities/post.js';
import {
  CreatePostData,
  IPostRepository,
  ListPostsFilters,
  ListPostsResult,
  UpdatePostData,
} from '../../domain/repositories/i-post-repository.js';
import { PostMapper, PostPersistenceRow } from '../../application/mappers/posts/post-mapper.js';
import {
  ACTIVE_PERIOD,
  TURMA_DA_EQUIPE,
  alunoVisivelParaAtor,
  visivelParaAtor,
} from './sql/turma-escopo.js';

// `classId` alcança os dois modos: a postagem endereçada à turma, e a endereçada a um aluno
// matriculado nela. Filtrar o feed por turma e perder o registro individual da criança
// daquela turma seria surpreendente para quem usa.
const FILTRO_TURMA = `
  @classId::uuid IS NULL
  OR EXISTS (
    SELECT 1 FROM postagem_turma pt
    WHERE pt.postagem_id = p.id AND pt.turma_id = @classId::uuid
  )
  OR EXISTS (
    SELECT 1 FROM postagem_aluno pa
    INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND ${ACTIVE_PERIOD('m')}
    WHERE pa.postagem_id = p.id AND m.turma_id = @classId::uuid
  )
`;

const TURMAS_DA_POSTAGEM = (alias: string): string => `
  SELECT jsonb_agg(jsonb_build_object('ID', t.id::text, 'NOME', t.nome) ORDER BY t.nome)
  FROM postagem_turma pt
  INNER JOIN turma t ON t.id = pt.turma_id
  WHERE pt.postagem_id = ${alias}
`;

// O array de alunos é recortado pelo ator: ver a postagem não é ver todos os destinatários
// dela. Ver `alunoVisivelParaAtor` em sql/turma-escopo.ts. O autor é exceção — ele escolheu
// os destinatários, então enxerga a lista que ele mesmo montou.
const ALUNOS_DA_POSTAGEM = (alias: string, autor: string): string => `
  SELECT jsonb_agg(
           jsonb_build_object(
             'ID', a.id::text,
             'NOME', pes.nome,
             'TURMA_ID', mt.turma_id::text,
             'NOME_TURMA', mt.nome
           ) ORDER BY pes.nome
         )
  FROM postagem_aluno pa
  INNER JOIN aluno a    ON a.id = pa.aluno_id
  INNER JOIN pessoa pes ON pes.id = a.pessoa_id
  LEFT JOIN LATERAL (
    SELECT m.turma_id, t.nome
    FROM matricula m
    INNER JOIN turma t ON t.id = m.turma_id
    WHERE m.aluno_id = a.id AND ${ACTIVE_PERIOD('m')}
    ORDER BY m.data_inicio DESC
    LIMIT 1
  ) mt ON true
  WHERE pa.postagem_id = ${alias}
    AND (${autor} = @viewerId::uuid OR (${alunoVisivelParaAtor('pa.aluno_id')}))
`;

const COLUNAS_DO_ITEM = (alias: string): string => `
  ${alias}.id::text                       AS "ID",
  ${alias}.destinatario::text             AS "DESTINATARIO",
  (${TURMAS_DA_POSTAGEM(`${alias}.id`)})  AS "TURMAS",
  (${ALUNOS_DA_POSTAGEM(`${alias}.id`, `${alias}.autor_id`)}) AS "ALUNOS",
  ${alias}.autor_id::text                 AS "AUTOR_ID",
  autor.nome                              AS "NOME_AUTOR",
  ${alias}.tipo::text                     AS "TIPO",
  ${alias}.titulo                         AS "TITULO",
  ${alias}.corpo                          AS "CORPO",
  to_char(${alias}.referente_a, 'YYYY-MM-DD') AS "REFERENTE_A",
  ${alias}.publicado_em                   AS "PUBLICADO_EM"
`;

// A contagem sai da CTE já filtrada: count(*) OVER () roda depois do WHERE e antes do
// LIMIT, então TOTAL_REGISTRO é o total real da consulta, não o tamanho da página.
const FROM_VISIVEL = `
  FROM postagem p
    WHERE p.status = @status::status_postagem
      -- Rascunho não tem audiência: não chegou a ninguém. Só o autor o enxerga, inclusive
      -- para quem tem abrangência ESCOLA — por isso @actorId, e não @viewerId.
      AND (@status::status_postagem <> 'RASCUNHO' OR p.autor_id = @actorId::uuid)
      AND (@type::tipo_postagem IS NULL OR p.tipo = @type::tipo_postagem)
      AND (${FILTRO_TURMA})
      AND (
        @studentId::uuid IS NULL
        OR EXISTS (
          SELECT 1 FROM postagem_aluno pa
          WHERE pa.postagem_id = p.id AND pa.aluno_id = @studentId::uuid
        )
      )
      AND (@authorId::uuid IS NULL OR p.autor_id = @authorId::uuid)
      AND (
        @status::status_postagem = 'RASCUNHO'
        OR @viewerId::uuid IS NULL
        OR (${visivelParaAtor('p')})
      )
`;

const SELECT_LIST = `
  WITH visivel AS (
    SELECT
      p.id,
      p.destinatario,
      p.autor_id,
      p.tipo,
      p.titulo,
      p.corpo,
      p.referente_a,
      p.publicado_em
    FROM postagem p
    WHERE p.status = @status::status_postagem
      -- Rascunho não tem audiência: não chegou a ninguém. Só o autor o enxerga, inclusive
      -- para quem tem abrangência ESCOLA — por isso @actorId, e não @viewerId.
      AND (@status::status_postagem <> 'RASCUNHO' OR p.autor_id = @actorId::uuid)
      AND (@type::tipo_postagem IS NULL OR p.tipo = @type::tipo_postagem)
      AND (${FILTRO_TURMA})
      AND (
        @studentId::uuid IS NULL
        OR EXISTS (
          SELECT 1 FROM postagem_aluno pa
          WHERE pa.postagem_id = p.id AND pa.aluno_id = @studentId::uuid
        )
      )
      AND (@authorId::uuid IS NULL OR p.autor_id = @authorId::uuid)
      AND (
        @status::status_postagem = 'RASCUNHO'
        OR @viewerId::uuid IS NULL
        OR (${visivelParaAtor('p')})
      )
  ),
  pagina AS (
    SELECT v.*, count(*) OVER () AS total_registro
    FROM visivel v
    ORDER BY v.publicado_em DESC, v.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS_DO_ITEM('pg')},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    pg.total_registro::int                                 AS "TOTAL_REGISTRO",
    ceil(pg.total_registro::numeric / @limit::numeric)::int AS "TOTAL_PAGINA"
  FROM pagina pg
  INNER JOIN usuario u    ON u.id = pg.autor_id
  INNER JOIN pessoa autor ON autor.id = u.pessoa_id
  ORDER BY pg.publicado_em DESC, pg.id;
`;

// Página fora do intervalo devolve zero linhas, e sem linha não há de onde ler as colunas de
// paginação. Esta contagem separa "coleção vazia" de "passei do fim" — o cliente não deveria
// ter de adivinhar qual dos dois. Roda só quando a página vem vazia, então não pesa no
// caminho quente. E `TOTAL_PAGINA` continua saindo do banco, não da aplicação.
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                        AS "PAGINA_ATUAL",
    @limit::int                                       AS "LIMITE_PAGINA",
    count(*)::int                                     AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int    AS "TOTAL_PAGINA"
  ${FROM_VISIVEL};
`;

// Fora da audiência, o recordset vem vazio e o use-case traduz em 404. Recusar por
// permissão aqui confirmaria que a postagem existe.
const SELECT_BY_ID = `
  SELECT ${COLUNAS_DO_ITEM('p')}
  FROM postagem p
  INNER JOIN usuario u    ON u.id = p.autor_id
  INNER JOIN pessoa autor ON autor.id = u.pessoa_id
  WHERE p.id = @postId::uuid
    AND (
      (
        p.status = 'PUBLICADA'
        AND (@viewerId::uuid IS NULL OR (${visivelParaAtor('p')}))
      )
      OR (p.status = 'RASCUNHO' AND p.autor_id = @actorId::uuid)
    );
`;

// Turmas alcançadas: diretas no modo TURMA, pela matrícula do aluno no modo ALUNO. É o que
// alimenta o `groupId` do guard de abrangência.
const SELECT_OWNERSHIP = `
  SELECT
    p.id::text        AS "ID",
    p.autor_id::text  AS "AUTOR_ID",
    p.status::text    AS "STATUS",
    p.destinatario::text AS "DESTINATARIO",
    (p.corpo IS NOT NULL AND btrim(p.corpo) <> '') AS "TEM_CORPO",
    EXISTS (SELECT 1 FROM midia mi WHERE mi.postagem_id = p.id) AS "TEM_MIDIA",
    coalesce(
      (
        SELECT array_agg(DISTINCT t.turma_id::text)
        FROM (
          SELECT pt.turma_id FROM postagem_turma pt WHERE pt.postagem_id = p.id
          UNION
          SELECT m.turma_id
          FROM postagem_aluno pa
          INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND ${ACTIVE_PERIOD('m')}
          WHERE pa.postagem_id = p.id
        ) t
      ),
      ARRAY[]::text[]
    ) AS "TURMAS"
  FROM postagem p
  WHERE p.id = @postId::uuid AND p.status <> 'REMOVIDA';
`;

// Escrita usa `TURMA_DA_EQUIPE`, não o escopo de leitura. Quem publica é a escola: professor
// e quem tem acesso concedido. O responsável lê e comenta — o caminho dele para a turma, pela
// matrícula do filho, não abre direito de endereçar postagem a ninguém.
const SELECT_TURMAS_FORA_DE_ESCOPO = `
  SELECT alvo.id::text AS "ID"
  FROM unnest(@classIds::uuid[]) AS alvo(id)
  WHERE alvo.id NOT IN (${TURMA_DA_EQUIPE});
`;

const SELECT_ALUNOS_FORA_DE_ESCOPO = `
  SELECT alvo.id::text AS "ID"
  FROM unnest(@studentIds::uuid[]) AS alvo(id)
  WHERE NOT EXISTS (
    SELECT 1 FROM matricula m
    WHERE m.aluno_id = alvo.id AND ${ACTIVE_PERIOD('m')}
      AND m.turma_id IN (${TURMA_DA_EQUIPE})
  );
`;

const INSERT_POSTAGEM = `
  INSERT INTO postagem (destinatario, autor_id, tipo, titulo, corpo, referente_a)
  VALUES (
    @audience::destinatario_postagem,
    @authorId::uuid,
    @type::tipo_postagem,
    @title,
    @body,
    coalesce(@referenceDate::date, CURRENT_DATE)
  )
  RETURNING id::text AS "ID";
`;

const INSERT_AUDIENCIA_TURMA = `
  INSERT INTO postagem_turma (postagem_id, turma_id)
  SELECT @postId::uuid, alvo.id FROM unnest(@classIds::uuid[]) AS alvo(id)
  ON CONFLICT DO NOTHING;
`;

const INSERT_AUDIENCIA_ALUNO = `
  INSERT INTO postagem_aluno (postagem_id, aluno_id)
  SELECT @postId::uuid, alvo.id FROM unnest(@studentIds::uuid[]) AS alvo(id)
  ON CONFLICT DO NOTHING;
`;

// coalesce com o valor atual deixa o PATCH parcial: o que não vier no corpo não muda. O
// `titulo` e o `corpo` são anuláveis de propósito, então @xSet distingue "não veio" de
// "veio null".
const UPDATE_POSTAGEM = `
  UPDATE postagem SET
    tipo        = coalesce(@type::tipo_postagem, tipo),
    titulo      = CASE WHEN @titleSet THEN @title ELSE titulo END,
    corpo       = CASE WHEN @bodySet THEN @body ELSE corpo END,
    referente_a = coalesce(@referenceDate::date, referente_a),
    destinatario = coalesce(@audience::destinatario_postagem, destinatario)
  WHERE id = @postId::uuid AND status <> 'REMOVIDA'
  RETURNING id::text AS "ID";
`;

const PUBLISH_POSTAGEM = `
  UPDATE postagem
  SET status = 'PUBLICADA', publicado_em = now()
  WHERE id = @postId::uuid AND status = 'RASCUNHO'
  RETURNING id::text AS "ID";
`;

const SOFT_DELETE_POSTAGEM = `
  UPDATE postagem
  SET status = 'REMOVIDA'
  WHERE id = @postId::uuid AND status <> 'REMOVIDA'
  RETURNING id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface OwnershipRow {
  ID: string;
  AUTOR_ID: string;
  STATUS: PostOwnership['status'];
  DESTINATARIO: PostOwnership['audience'];
  TEM_CORPO: boolean;
  TEM_MIDIA: boolean;
  TURMAS: string[];
}

export class PostRepository implements IPostRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListPostsFilters): Promise<ListPostsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      classId: filters.classId,
      studentId: filters.studentId,
      authorId: filters.authorId,
      type: filters.type,
      status: filters.status,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<PostPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return { items: rows.map(PostMapper.fromPersistence), pagination: paginationFromRow(first) };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(
    postId: string,
    viewerId: string | null,
    actorId: string | null,
  ): Promise<Post | null> {
    const rows = await this.db.query<PostPersistenceRow>(SELECT_BY_ID, {
      postId,
      viewerId,
      actorId,
    });
    const first = rows[0];

    return first ? PostMapper.fromPersistence(first) : null;
  }
  async findOwnership(postId: string): Promise<PostOwnership | null> {
    const rows = await this.db.query<OwnershipRow>(SELECT_OWNERSHIP, { postId });
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.ID,
      authorId: row.AUTOR_ID,
      status: row.STATUS,
      audience: row.DESTINATARIO,
      groupIds: row.TURMAS,
      hasBody: row.TEM_CORPO,
      hasMedia: row.TEM_MIDIA,
    };
  }

  async findClassesOutOfScope(classIds: string[], actorId: string): Promise<string[]> {
    const rows = await this.db.query<IdRow>(SELECT_TURMAS_FORA_DE_ESCOPO, {
      classIds,
      viewerId: actorId,
    });
    return rows.map((row) => row.ID);
  }

  async findStudentsOutOfScope(studentIds: string[], actorId: string): Promise<string[]> {
    const rows = await this.db.query<IdRow>(SELECT_ALUNOS_FORA_DE_ESCOPO, {
      studentIds,
      viewerId: actorId,
    });
    return rows.map((row) => row.ID);
  }

  // Chamado dentro de uma transação: as queries são sequenciais de propósito, porque a
  // transação vive em UMA conexão e duas em paralelo se atropelariam no mesmo client.
  async create(data: CreatePostData): Promise<string> {
    const rows = await this.db.query<IdRow>(INSERT_POSTAGEM, {
      audience: data.audience,
      authorId: data.authorId,
      type: data.type,
      title: data.title,
      body: data.body,
      referenceDate: data.referenceDate,
    });

    const postId = rows[0]!.ID;
    await this.gravarAudiencia(postId, data.audience, data.classIds, data.studentIds);

    return postId;
  }

  async update(postId: string, data: UpdatePostData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE_POSTAGEM, {
      postId,
      type: data.type ?? null,
      titleSet: data.title !== undefined,
      title: data.title ?? null,
      bodySet: data.body !== undefined,
      body: data.body ?? null,
      referenceDate: data.referenceDate ?? null,
      audience: data.audience ?? null,
    });

    if (rows.length === 0) return false;
    if (data.audience === undefined) return true;

    // Trocar a audiência é substituí-la por inteiro: apagar as duas tabelas e regravar
    // deixa o estado coerente sem precisar diferenciar o que entrou e o que saiu.
    await this.db.query('DELETE FROM postagem_turma WHERE postagem_id = @postId::uuid;', {
      postId,
    });
    await this.db.query('DELETE FROM postagem_aluno WHERE postagem_id = @postId::uuid;', {
      postId,
    });
    await this.gravarAudiencia(postId, data.audience, data.classIds ?? [], data.studentIds ?? []);

    return true;
  }

  async publish(postId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(PUBLISH_POSTAGEM, { postId });
    return rows.length > 0;
  }

  async softDelete(postId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(SOFT_DELETE_POSTAGEM, { postId });
    return rows.length > 0;
  }

  private async gravarAudiencia(
    postId: string,
    audience: PostOwnership['audience'],
    classIds: string[],
    studentIds: string[],
  ): Promise<void> {
    if (audience === 'TURMA') {
      await this.db.query(INSERT_AUDIENCIA_TURMA, { postId, classIds });
      return;
    }

    await this.db.query(INSERT_AUDIENCIA_ALUNO, { postId, studentIds });
  }
}
