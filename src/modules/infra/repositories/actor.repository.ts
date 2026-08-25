import { ActorKind, IActorRepository, RawActor } from '@shared/auth/index.js';
import { PostgresDatabase } from '@shared/infra/database/index.js';
import { formatPersonName } from '@shared/utils/name/index.js';

interface ActorFeatureRow {
  ID: string;
  NOME: string;
  FEATURE: string | null;
}

interface GroupRow {
  GROUP_ID: string;
}

const VIGENTE = (alias: string): string =>
  `(${alias}.data_fim IS NULL OR ${alias}.data_fim >= CURRENT_DATE)`;

const JOIN_PERMISSOES = `
  LEFT JOIN usuario_perfil up
    ON up.usuario_id = u.id
    AND up.data_inicio <= CURRENT_DATE
    AND ${VIGENTE('up')}
  LEFT JOIN perfil_permissao pp ON pp.perfil_id = up.perfil_id
  LEFT JOIN permissao pm        ON pm.id = pp.permissao_id
`;

const SELECT_ACTOR_BY_SESSION = `
  SELECT
    u.id::text                          AS "ID",
    p.nome                              AS "NOME",
    pm.codigo || ':' || pp.abrangencia  AS "FEATURE"
  FROM sessao s
  INNER JOIN usuario u ON u.id = s.usuario_id AND u.ativo = true
  INNER JOIN pessoa p  ON p.id = u.pessoa_id
  ${JOIN_PERMISSOES}
  WHERE s.token_hash = @tokenHash
    AND s.expira_em > now()
    AND s.expira_absoluto_em > now();
`;

const SELECT_ACTOR_BY_API_TOKEN = `
  SELECT
    u.id::text                          AS "ID",
    p.nome                              AS "NOME",
    pm.codigo || ':' || pp.abrangencia  AS "FEATURE"
  FROM api_token t
  INNER JOIN usuario u ON u.id = t.usuario_id AND u.ativo = true
  INNER JOIN pessoa p  ON p.id = u.pessoa_id
  ${JOIN_PERMISSOES}
  WHERE t.token_hash = @tokenHash
    AND t.revogado_em IS NULL
    AND t.expira_em > now();
`;

const SELECT_GROUPS = `
  SELECT DISTINCT m.turma_id::text AS "GROUP_ID"
  FROM usuario u
  INNER JOIN responsavel r        ON r.pessoa_id = u.pessoa_id
  INNER JOIN responsavel_aluno ra ON ra.responsavel_id = r.id AND ${VIGENTE('ra')}
  INNER JOIN matricula m          ON m.aluno_id = ra.aluno_id AND ${VIGENTE('m')}
  WHERE u.id = @usuarioId::uuid

  UNION

  SELECT DISTINCT pt.turma_id::text AS "GROUP_ID"
  FROM usuario u
  INNER JOIN professor pr        ON pr.pessoa_id = u.pessoa_id AND pr.ativo = true
  INNER JOIN professor_turma pt  ON pt.professor_id = pr.id AND ${VIGENTE('pt')}
  WHERE u.id = @usuarioId::uuid

  UNION

  SELECT DISTINCT ac.turma_id::text AS "GROUP_ID"
  FROM acesso_turma ac
  WHERE ac.usuario_id = @usuarioId::uuid AND ${VIGENTE('ac')};
`;

const toRawActor = (rows: ActorFeatureRow[], kind: ActorKind): RawActor | null => {
  const primeira = rows[0];
  if (!primeira) return null;

  return {
    id: primeira.ID,
    kind,
    name: formatPersonName(primeira.NOME),
    features: rows
      .map((row) => row.FEATURE)
      .filter((feature): feature is string => feature !== null),
  };
};

export class ActorRepository implements IActorRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findActorBySessionToken(tokenHash: string): Promise<RawActor | null> {
    const rows = await this.db.query<ActorFeatureRow>(SELECT_ACTOR_BY_SESSION, { tokenHash });
    return toRawActor(rows, 'user');
  }

  async findActorByApiToken(tokenHash: string): Promise<RawActor | null> {
    const rows = await this.db.query<ActorFeatureRow>(SELECT_ACTOR_BY_API_TOKEN, { tokenHash });
    return toRawActor(rows, 'api-token');
  }

  async findGroups(usuarioId: string): Promise<string[]> {
    const rows = await this.db.query<GroupRow>(SELECT_GROUPS, { usuarioId });
    return rows.map((row) => row.GROUP_ID);
  }
}
