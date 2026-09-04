import { PaginatedRow, PostgresDatabase, paginationFromRow } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { Comment, CommentOwnership } from '../../domain/entities/comment.js';
import {
  CreateCommentData,
  ICommentRepository,
  ListCommentsFilters,
  ListCommentsResult,
  RemoveCommentData,
} from '../../domain/repositories/i-comment-repository.js';
import {
  CommentMapper,
  CommentPersistenceRow,
} from '../../application/mappers/posts/comments/comment-mapper.js';
import { ACTIVE_PERIOD } from './sql/vigencia.js';

// O corpo do comentário removido não sai do banco. A linha fica — é a prova de que a
// moderação aconteceu —, mas o texto some para todo mundo, inclusive para quem moderou.
// Filtrar na aplicação deixaria o texto trafegar; aqui ele nem chega ao processo.
const CORPO_VISIVEL = `CASE WHEN c.status = 'PUBLICADO' THEN c.corpo ELSE NULL END`;

const COLUNAS = (alias: string, autor: string, autorPessoa: string): string => `
  ${alias}.id::text          AS "ID",
  ${alias}.postagem_id::text AS "POSTAGEM_ID",
  ${alias}.autor_id::text    AS "AUTOR_ID",
  ${autorPessoa}::text       AS "AUTOR_PESSOA_ID",
  ${autor}                   AS "AUTOR_NOME",
  ${alias}.corpo             AS "CORPO",
  ${alias}.status::text      AS "STATUS",
  ${alias}.motivo_remocao    AS "MOTIVO_REMOCAO",
  ${alias}.criado_em         AS "CRIADO_EM",
  ${alias}.editado_em        AS "EDITADO_EM"
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT
      c.id,
      c.postagem_id,
      c.autor_id,
      pes.id AS autor_pessoa_id,
      pes.nome AS autor_nome,
      ${CORPO_VISIVEL} AS corpo,
      c.status,
      c.motivo_remocao,
      c.criado_em,
      c.editado_em,
      count(*) OVER () AS total_registro
    FROM postagem_comentario c
    INNER JOIN usuario u  ON u.id = c.autor_id
    INNER JOIN pessoa pes ON pes.id = u.pessoa_id
    WHERE c.postagem_id = @postId::uuid
    ORDER BY c.criado_em, c.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS('pagina', 'pagina.autor_nome', 'pagina.autor_pessoa_id')},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.criado_em, pagina.id;
`;

const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM postagem_comentario c
  WHERE c.postagem_id = @postId::uuid;
`;

// As turmas da postagem, pelas duas origens do modelo — diretas e via matrícula do aluno
// nomeado. É por elas que a moderação de abrangência TURMA alcança o comentário.
const SELECT_OWNERSHIP = `
  SELECT
    c.id::text          AS "ID",
    c.postagem_id::text AS "POSTAGEM_ID",
    c.autor_id::text    AS "AUTOR_ID",
    c.status::text      AS "STATUS",
    coalesce(
      (
        SELECT array_agg(DISTINCT t.turma_id::text)
        FROM (
          SELECT pt.turma_id FROM postagem_turma pt WHERE pt.postagem_id = c.postagem_id
          UNION
          SELECT m.turma_id
          FROM postagem_aluno pa
          INNER JOIN matricula m ON m.aluno_id = pa.aluno_id AND ${ACTIVE_PERIOD('m')}
          WHERE pa.postagem_id = c.postagem_id
        ) t
      ),
      ARRAY[]::text[]
    ) AS "TURMAS"
  FROM postagem_comentario c
  WHERE c.id = @commentId::uuid AND c.postagem_id = @postId::uuid;
`;

const INSERT = `
  WITH novo AS (
    INSERT INTO postagem_comentario (postagem_id, autor_id, corpo)
    VALUES (@postId::uuid, @authorId::uuid, @body::text)
    RETURNING *
  )
  SELECT ${COLUNAS('c', 'pes.nome', 'pes.id')}
  FROM novo c
  INNER JOIN usuario u  ON u.id = c.autor_id
  INNER JOIN pessoa pes ON pes.id = u.pessoa_id;
`;

// `status = 'PUBLICADO'` no WHERE torna a remoção idempotente pelo lado errado de propósito:
// remover o que já foi removido devolve zero linhas, e o use-case traduz em 404. Reescrever
// o motivo de uma moderação já registrada apagaria a versão original do registro.
const REMOVE = `
  UPDATE postagem_comentario c SET
    status = CASE WHEN @byAuthor::boolean
                  THEN 'REMOVIDO_PELO_AUTOR'::status_comentario
                  ELSE 'REMOVIDO_PELA_ESCOLA'::status_comentario END,
    removido_por   = @removedBy::uuid,
    removido_em    = now(),
    motivo_remocao = @reason::text
  WHERE c.id = @commentId::uuid
    AND c.postagem_id = @postId::uuid
    AND c.status = 'PUBLICADO'
  RETURNING c.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface OwnershipRow {
  ID: string;
  POSTAGEM_ID: string;
  AUTOR_ID: string;
  STATUS: CommentOwnership['status'];
  TURMAS: string[];
}

const comFormato = (comment: Comment): Comment => ({
  ...comment,
  authorName: formatPersonName(comment.authorName),
});

export class CommentRepository implements ICommentRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListCommentsFilters): Promise<ListCommentsResult> {
    const variables = {
      postId: filters.postId,
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
    };

    const rows = await this.db.query<CommentPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map((row) => comFormato(CommentMapper.fromPersistence(row))),
        pagination: paginationFromRow(first),
      };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total
        ? paginationFromRow(total)
        : { page: filters.page, limit: filters.limit, totalResults: 0, totalPages: 0 },
    };
  }

  async findOwnership(commentId: string, postId: string): Promise<CommentOwnership | null> {
    const rows = await this.db.query<OwnershipRow>(SELECT_OWNERSHIP, { commentId, postId });
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.ID,
      postId: row.POSTAGEM_ID,
      authorId: row.AUTOR_ID,
      status: row.STATUS,
      groupIds: row.TURMAS,
    };
  }

  async create(data: CreateCommentData): Promise<Comment> {
    const rows = await this.db.query<CommentPersistenceRow>(INSERT, {
      postId: data.postId,
      authorId: data.authorId,
      body: data.body,
    });

    const row = rows[0];
    if (!row) throw new Error('INSERT de comentário não devolveu linha');

    return comFormato(CommentMapper.fromPersistence(row));
  }

  async remove(data: RemoveCommentData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REMOVE, {
      commentId: data.commentId,
      postId: data.postId,
      removedBy: data.removedBy,
      byAuthor: data.byAuthor,
      reason: data.reason,
    });

    return rows.length > 0;
  }
}
