import {
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import {
  IPostRepository,
  ListPostsFilters,
  ListPostsResult,
} from '../../domain/repositories/i-post-repository.js';
import { PostMapper, PostPersistenceRow } from '../../application/mappers/posts/post-mapper.js';

const ACTIVE_PERIOD = (alias: string): string =>
  `(${alias}.data_fim IS NULL OR ${alias}.data_fim >= CURRENT_DATE)`;

// As três origens de vínculo do modelo v2, unidas. Espelha a view `turma_no_escopo` da
// 002_rls.sql, parametrizada por @viewerId — a view filtra por app_usuario_id(), o GUC que
// só passa a ser alimentado na Fase 6.
// TODO(2.4): as três CTEs abaixo saem para infra/repositories/sql/turma-escopo.ts quando
// aparecer o segundo consumidor (o GET /posts/:postId).
const TURMA_NO_ESCOPO = `
  SELECT m.turma_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND ${ACTIVE_PERIOD('m')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT pt.turma_id
  FROM usuario u
  INNER JOIN professor pr       ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT ac.turma_id
  FROM acesso_turma ac
  WHERE ac.usuario_id = @viewerId::uuid AND ${ACTIVE_PERIOD('ac')}
`;

// Só as origens de EQUIPE. Espelha a view `turma_da_equipe` da 005.
const TURMA_DA_EQUIPE = `
  SELECT pt.turma_id
  FROM usuario u
  INNER JOIN professor pr       ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE u.id = @viewerId::uuid

  UNION

  SELECT ac.turma_id
  FROM acesso_turma ac
  WHERE ac.usuario_id = @viewerId::uuid AND ${ACTIVE_PERIOD('ac')}
`;

// Os alunos sob responsabilidade do ator. Espelha a view `aluno_no_escopo` da 005.
const ALUNO_NO_ESCOPO = `
  SELECT ra.aluno_id
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  WHERE u.id = @viewerId::uuid
`;

// A audiência tem dois modos, e o recorte segue os dois caminhos.
//
// No modo ALUNO o responsável entra **pelo aluno** e a equipe **pela turma do aluno**, em
// ramos separados de propósito: um único ramo por turma faria o responsável de qualquer
// criança daquela turma enxergar a postagem individual sobre a criança dos outros.
const VISIVEL_PARA_ATOR = `
  EXISTS (
    SELECT 1 FROM postagem_turma pt
    WHERE pt.postagem_id = p.id AND pt.turma_id IN (${TURMA_NO_ESCOPO})
  )
  OR EXISTS (
    SELECT 1 FROM postagem_aluno pa
    WHERE pa.postagem_id = p.id AND pa.aluno_id IN (${ALUNO_NO_ESCOPO})
  )
  OR EXISTS (
    SELECT 1 FROM postagem_aluno pa
    INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND ${ACTIVE_PERIOD('m')}
    WHERE pa.postagem_id = p.id AND m.turma_id IN (${TURMA_DA_EQUIPE})
  )
`;

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

// A contagem sai da CTE já filtrada: count(*) OVER () roda depois do WHERE e antes do
// LIMIT, então TOTAL_REGISTRO é o total real da consulta, não o tamanho da página.
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
    WHERE p.status = 'PUBLICADA'
      AND (@type::tipo_postagem IS NULL OR p.tipo = @type::tipo_postagem)
      AND (${FILTRO_TURMA})
      AND (
        @studentId::uuid IS NULL
        OR EXISTS (
          SELECT 1 FROM postagem_aluno pa
          WHERE pa.postagem_id = p.id AND pa.aluno_id = @studentId::uuid
        )
      )
      AND (@viewerId::uuid IS NULL OR (${VISIVEL_PARA_ATOR}))
  ),
  pagina AS (
    SELECT v.*, count(*) OVER () AS total_registro
    FROM visivel v
    ORDER BY v.publicado_em DESC, v.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    pg.id::text                                             AS "ID",
    pg.destinatario::text                                   AS "DESTINATARIO",
    (
      SELECT jsonb_agg(jsonb_build_object('ID', t.id::text, 'NOME', t.nome) ORDER BY t.nome)
      FROM postagem_turma pt
      INNER JOIN turma t ON t.id = pt.turma_id
      WHERE pt.postagem_id = pg.id
    )                                                       AS "TURMAS",
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'ID', a.id::text,
                 'NOME', pes.nome,
                 'TURMA_ID', mt.turma_id::text,
                 'NOME_TURMA', mt.nome
               ) ORDER BY pes.nome
             )
      FROM postagem_aluno pa
      INNER JOIN aluno a   ON a.id = pa.aluno_id
      INNER JOIN pessoa pes ON pes.id = a.pessoa_id
      LEFT JOIN LATERAL (
        SELECT m.turma_id, t.nome
        FROM matricula m
        INNER JOIN turma t ON t.id = m.turma_id
        WHERE m.aluno_id = a.id AND ${ACTIVE_PERIOD('m')}
        ORDER BY m.data_inicio DESC
        LIMIT 1
      ) mt ON true
      WHERE pa.postagem_id = pg.id
    )                                                       AS "ALUNOS",
    pg.autor_id::text                                       AS "AUTOR_ID",
    autor.nome                                              AS "NOME_AUTOR",
    pg.tipo::text                                           AS "TIPO",
    pg.titulo                                               AS "TITULO",
    pg.corpo                                                AS "CORPO",
    to_char(pg.referente_a, 'YYYY-MM-DD')                   AS "REFERENTE_A",
    pg.publicado_em                                         AS "PUBLICADO_EM",
    @page::int                                              AS "PAGINA_ATUAL",
    @limit::int                                             AS "LIMITE_PAGINA",
    pg.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pg.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina pg
  INNER JOIN usuario u    ON u.id = pg.autor_id
  INNER JOIN pessoa autor ON autor.id = u.pessoa_id
  ORDER BY pg.publicado_em DESC, pg.id;
`;

export class PostRepository implements IPostRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListPostsFilters): Promise<ListPostsResult> {
    const rows = await this.db.query<PostPersistenceRow>(SELECT_LIST, {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      classId: filters.classId,
      studentId: filters.studentId,
      type: filters.type,
      viewerId: filters.viewerId,
    });

    const first = rows[0];

    return {
      items: rows.map(PostMapper.fromPersistence),
      // Recordset vazio não traz as colunas de paginação: não há linha de onde lê-las.
      pagination: first ? paginationFromRow(first) : emptyPagination(filters.page, filters.limit),
    };
  }
}
