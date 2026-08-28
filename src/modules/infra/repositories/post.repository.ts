import {
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Post } from '../../domain/entities/post.js';
import {
  IPostRepository,
  ListPostsFilters,
  ListPostsResult,
} from '../../domain/repositories/i-post-repository.js';
import { PostMapper, PostPersistenceRow } from '../../application/mappers/posts/post-mapper.js';
import { ACTIVE_PERIOD, alunoVisivelParaAtor, visivelParaAtor } from './sql/turma-escopo.js';

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
      AND (@authorId::uuid IS NULL OR p.autor_id = @authorId::uuid)
      AND (@viewerId::uuid IS NULL OR (${visivelParaAtor('p')}))
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

// Fora da audiência, o recordset vem vazio e o use-case traduz em 404. Recusar por
// permissão aqui confirmaria que a postagem existe.
const SELECT_BY_ID = `
  SELECT ${COLUNAS_DO_ITEM('p')}
  FROM postagem p
  INNER JOIN usuario u    ON u.id = p.autor_id
  INNER JOIN pessoa autor ON autor.id = u.pessoa_id
  WHERE p.id = @postId::uuid
    AND p.status = 'PUBLICADA'
    AND (@viewerId::uuid IS NULL OR (${visivelParaAtor('p')}));
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
      authorId: filters.authorId,
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

  async findById(postId: string, viewerId: string | null): Promise<Post | null> {
    const rows = await this.db.query<PostPersistenceRow>(SELECT_BY_ID, { postId, viewerId });
    const first = rows[0];

    return first ? PostMapper.fromPersistence(first) : null;
  }
}
