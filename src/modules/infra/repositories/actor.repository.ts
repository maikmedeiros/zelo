import { Actor, IActorRepository } from '@shared/auth/index.js';
import { PostgresDatabase } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';

interface ActorPersistenceRow {
  ID: string;
  HANDLE: string;
  NOME: string;
  CAPABILITIES: string[] | null;
}

const SELECT_ACTOR_BY_SESSION = `
  SELECT
    u.id::text                                    AS "ID",
    u.handle                                      AS "HANDLE",
    u.nome                                        AS "NOME",
    array_remove(array_agg(DISTINCT pc.capability), NULL) AS "CAPABILITIES"
  FROM sessao s
  INNER JOIN usuario u ON u.id = s.usuario_id
  LEFT JOIN perfil_capability pc ON pc.perfil = u.perfil
  WHERE s.token_hash = @tokenHash
    AND s.revogada_em IS NULL
    AND s.expira_em > now()
    AND u.ativo = true
  GROUP BY u.id, u.handle, u.nome;
`;

const SELECT_ACTOR_BY_API_KEY = `
  SELECT
    k.id::text                                    AS "ID",
    k.id::text                                    AS "HANDLE",
    k.nome                                        AS "NOME",
    array_remove(array_agg(DISTINCT kc.capability), NULL) AS "CAPABILITIES"
  FROM api_key k
  LEFT JOIN api_key_capability kc ON kc.api_key_id = k.id
  WHERE k.chave_hash = @keyHash
    AND k.ativo = true
    AND (k.expira_em IS NULL OR k.expira_em > now())
  GROUP BY k.id, k.nome;
`;

export class ActorRepository implements IActorRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findActorBySessionToken(tokenHash: string): Promise<Actor | null> {
    const rows = await this.db.query<ActorPersistenceRow>(SELECT_ACTOR_BY_SESSION, { tokenHash });
    if (rows.length === 0) return null;
    return toActor(rows[0]!, 'user');
  }

  async findActorByApiKey(keyHash: string): Promise<Actor | null> {
    const rows = await this.db.query<ActorPersistenceRow>(SELECT_ACTOR_BY_API_KEY, { keyHash });
    if (rows.length === 0) return null;
    return toActor(rows[0]!, 'api-key');
  }
}

const toActor = (row: ActorPersistenceRow, kind: Actor['kind']): Actor => ({
  id: row.ID,
  kind,
  handle: row.HANDLE,
  name: kind === 'user' ? formatPersonName(row.NOME) : row.NOME,
  features: row.CAPABILITIES ?? [],
});
