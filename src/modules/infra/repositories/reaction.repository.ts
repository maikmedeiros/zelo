import { PostgresDatabase } from '@shared/infra/database/index.js';
import { ReactionSummary, ReactionType } from '../../domain/entities/reaction.js';
import { IReactionRepository } from '../../domain/repositories/i-reaction-repository.js';
import {
  ReactionMapper,
  ReactionTallyPersistenceRow,
  ReactionTypePersistenceRow,
} from '../../application/mappers/posts/reactions/reaction-mapper.js';

// `ativo = false` aposenta a reação sem apagar a linha — o histórico de quem já reagiu com
// ela continua válido, e é por isso que o FK é RESTRICT.
const SELECT_TYPES = `
  SELECT r.codigo AS "CODIGO", r.rotulo AS "ROTULO", r.emoji AS "EMOJI", r.ordem AS "ORDEM"
  FROM reacao r
  WHERE r.ativo = true
  ORDER BY r.ordem, r.id;
`;

// LEFT JOIN e não INNER: o tipo sem nenhuma reação precisa aparecer com zero, senão a barra
// de emojis do cliente mudaria de tamanho conforme a postagem.
const SELECT_TALLIES = `
  SELECT
    r.codigo AS "CODIGO",
    r.rotulo AS "ROTULO",
    r.emoji  AS "EMOJI",
    r.ordem  AS "ORDEM",
    count(pr.id)::int AS "TOTAL"
  FROM reacao r
  LEFT JOIN postagem_reacao pr
    ON pr.reacao_id = r.id AND pr.postagem_id = @postId::uuid
  WHERE r.ativo = true
  GROUP BY r.id, r.codigo, r.rotulo, r.emoji, r.ordem
  ORDER BY r.ordem, r.id;
`;

const SELECT_MINE = `
  SELECT r.codigo AS "CODIGO"
  FROM postagem_reacao pr
  INNER JOIN reacao r ON r.id = pr.reacao_id
  WHERE pr.postagem_id = @postId::uuid AND pr.usuario_id = @actorId::uuid;
`;

// `INSERT ... SELECT` com o código na subconsulta: código inexistente ou aposentado produz
// zero linhas na origem, então nada é inserido e o RETURNING vem vazio. Fosse `VALUES` com
// uma subconsulta escalar, o `reacao_id` viria NULL e o erro seria de constraint — 500 em
// vez do 422 que o caso merece.
//
// O `DO UPDATE` é o "trocar de reação é UPDATE" do modelo: o índice
// `uq_reacao_por_usuario` garante uma linha por pessoa e por postagem.
const UPSERT = `
  INSERT INTO postagem_reacao (postagem_id, usuario_id, reacao_id)
  SELECT @postId::uuid, @actorId::uuid, r.id
  FROM reacao r
  WHERE r.codigo = @code::text AND r.ativo = true
  ON CONFLICT (postagem_id, usuario_id) DO UPDATE SET
    reacao_id   = EXCLUDED.reacao_id,
    alterado_em = now()
  RETURNING id::text AS "ID";
`;

const DELETE = `
  DELETE FROM postagem_reacao pr
  WHERE pr.postagem_id = @postId::uuid AND pr.usuario_id = @actorId::uuid
  RETURNING pr.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface CodeRow {
  CODIGO: string;
}

export class ReactionRepository implements IReactionRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async listTypes(): Promise<ReactionType[]> {
    const rows = await this.db.query<ReactionTypePersistenceRow>(SELECT_TYPES, {});
    return rows.map(ReactionMapper.typeFromPersistence);
  }

  async summary(postId: string, actorId: string): Promise<ReactionSummary> {
    // Duas consultas em paralelo: são leituras independentes, fora de transação, então não
    // disputam a mesma conexão — a restrição do CLAUDE.md §7 vale dentro do `work`.
    const [tallies, mine] = await Promise.all([
      this.db.query<ReactionTallyPersistenceRow>(SELECT_TALLIES, { postId }),
      this.db.query<CodeRow>(SELECT_MINE, { postId, actorId }),
    ]);

    return {
      postId,
      total: tallies.reduce((soma, row) => soma + row.TOTAL, 0),
      tallies: tallies.map((row) => ({
        ...ReactionMapper.typeFromPersistence(row),
        count: row.TOTAL,
      })),
      mine: mine[0]?.CODIGO ?? null,
    };
  }

  async set(postId: string, actorId: string, code: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPSERT, { postId, actorId, code });
    return rows.length > 0;
  }

  async remove(postId: string, actorId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { postId, actorId });
    return rows.length > 0;
  }
}
