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

// As três origens de vínculo do modelo v2. Espelha a view `turma_no_escopo` da 002_rls.sql,
// mas parametrizada por @viewerId: a view filtra por app_usuario_id(), o GUC que só passa a
// ser alimentado na Fase 6. As duas grafias precisam concordar — mexeu em uma, confira a
// outra.
// TODO(2.4): extrair para infra/repositories/sql/turma-escopo.ts no segundo consumidor.
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

// A contagem sai da CTE já filtrada: count(*) OVER () roda depois do WHERE e antes do
// LIMIT, então TOTAL_REGISTRO é o total real da consulta, não o tamanho da página. É o que
// dispensa a aplicação de computar totalPages.
const SELECT_LIST = `
  WITH visivel AS (
    SELECT
      p.id,
      p.turma_id,
      p.autor_id,
      p.tipo,
      p.titulo,
      p.corpo,
      p.referente_a,
      p.publicado_em
    FROM postagem p
    WHERE p.status = 'PUBLICADA'
      AND (@classId::uuid IS NULL OR p.turma_id = @classId::uuid)
      AND (@type::tipo_postagem IS NULL OR p.tipo = @type::tipo_postagem)
      AND (@viewerId::uuid IS NULL OR p.turma_id IN (${TURMA_NO_ESCOPO}))
  ),
  pagina AS (
    SELECT v.*, count(*) OVER () AS total_registro
    FROM visivel v
    ORDER BY v.publicado_em DESC, v.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    pg.id::text                                                  AS "ID",
    pg.turma_id::text                                            AS "TURMA_ID",
    t.nome                                                       AS "NOME_TURMA",
    pg.autor_id::text                                            AS "AUTOR_ID",
    autor.nome                                                   AS "NOME_AUTOR",
    pg.tipo::text                                                AS "TIPO",
    pg.titulo                                                    AS "TITULO",
    pg.corpo                                                     AS "CORPO",
    to_char(pg.referente_a, 'YYYY-MM-DD')                        AS "REFERENTE_A",
    pg.publicado_em                                              AS "PUBLICADO_EM",
    @page::int                                                   AS "PAGINA_ATUAL",
    @limit::int                                                  AS "LIMITE_PAGINA",
    pg.total_registro::int                                       AS "TOTAL_REGISTRO",
    ceil(pg.total_registro::numeric / @limit::numeric)::int       AS "TOTAL_PAGINA"
  FROM pagina pg
  INNER JOIN turma t       ON t.id = pg.turma_id
  INNER JOIN usuario u     ON u.id = pg.autor_id
  INNER JOIN pessoa autor  ON autor.id = u.pessoa_id
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
