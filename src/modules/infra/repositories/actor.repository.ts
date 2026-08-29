import { ActorKind, IActorRepository, RawActor } from '@shared/auth/index.js';
import { PostgresDatabase } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';
import { ACTIVE_PERIOD } from './sql/vigencia.js';

interface ActorFeatureRow {
  ID: string;
  NOME: string;
  FEATURE: string | null;
}

interface GroupRow {
  GROUP_ID: string;
}

const JOIN_PERMISSIONS = `
  LEFT JOIN usuario_perfil up
    ON up.usuario_id = u.id
    AND up.data_inicio <= CURRENT_DATE
    AND ${ACTIVE_PERIOD('up')}
  LEFT JOIN perfil_permissao pp ON pp.perfil_id = up.perfil_id
  LEFT JOIN permissao pm        ON pm.id = pp.permissao_id
`;

const SELECT_ACTOR_BY_SESSION = `
  WITH renovada AS (
    UPDATE sessao
    SET ultima_atividade_em = now(),
        expira_em = LEAST(now() + @idleWindow::interval, expira_absoluto_em)
    WHERE token_hash = @tokenHash
      AND expira_em > now()
      AND expira_absoluto_em > now()
    RETURNING usuario_id
  )
  SELECT
    u.id::text                          AS "ID",
    p.nome                              AS "NOME",
    pm.codigo || ':' || pp.abrangencia  AS "FEATURE"
  FROM renovada s
  INNER JOIN usuario u ON u.id = s.usuario_id AND u.ativo = true
  INNER JOIN pessoa p  ON p.id = u.pessoa_id
  ${JOIN_PERMISSIONS};
`;

const SELECT_ACTOR_BY_API_TOKEN = `
  SELECT
    u.id::text                          AS "ID",
    p.nome                              AS "NOME",
    pm.codigo || ':' || pp.abrangencia  AS "FEATURE"
  FROM api_token t
  INNER JOIN usuario u ON u.id = t.usuario_id AND u.ativo = true
  INNER JOIN pessoa p  ON p.id = u.pessoa_id
  ${JOIN_PERMISSIONS}
  WHERE t.token_hash = @tokenHash
    AND t.revogado_em IS NULL
    AND t.expira_em > now();
`;

const SELECT_GROUPS = `
  SELECT DISTINCT m.turma_id::text AS "GROUP_ID"
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND ${ACTIVE_PERIOD('m')}
  WHERE u.id = @userId::uuid

  UNION

  SELECT DISTINCT pt.turma_id::text AS "GROUP_ID"
  FROM usuario u
  INNER JOIN professor pr        ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt  ON pt.professor_id = pr.id AND ${ACTIVE_PERIOD('pt')}
  WHERE u.id = @userId::uuid

  UNION

  SELECT DISTINCT ac.turma_id::text AS "GROUP_ID"
  FROM acesso_turma ac
  WHERE ac.usuario_id = @userId::uuid AND ${ACTIVE_PERIOD('ac')};
`;

const toRawActor = (rows: ActorFeatureRow[], kind: ActorKind): RawActor | null => {
  const first = rows[0];
  if (!first) return null;

  return {
    id: first.ID,
    kind,
    name: formatPersonName(first.NOME),
    features: rows
      .map((row) => row.FEATURE)
      .filter((feature): feature is string => feature !== null),
  };
};

export class ActorRepository implements IActorRepository {
  constructor(
    private readonly db: PostgresDatabase,
    private readonly idleWindowDias: number,
  ) {}

  async findActorBySessionToken(tokenHash: string): Promise<RawActor | null> {
    const rows = await this.db.query<ActorFeatureRow>(SELECT_ACTOR_BY_SESSION, {
      tokenHash,
      idleWindow: `${this.idleWindowDias} days`,
    });
    return toRawActor(rows, 'user');
  }

  async findActorByApiToken(tokenHash: string): Promise<RawActor | null> {
    const rows = await this.db.query<ActorFeatureRow>(SELECT_ACTOR_BY_API_TOKEN, { tokenHash });
    return toRawActor(rows, 'api-token');
  }

  async findGroups(userId: string): Promise<string[]> {
    const rows = await this.db.query<GroupRow>(SELECT_GROUPS, { userId });
    return rows.map((row) => row.GROUP_ID);
  }
}
