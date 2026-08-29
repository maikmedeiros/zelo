import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { AuthenticatedUser, UserAccount, UserCredentials } from '../../domain/entities/user.js';
import {
  CreateUserData,
  IUserRepository,
  ListUsersFilters,
  ListUsersResult,
  UpdateUserData,
} from '../../domain/repositories/i-user-repository.js';
import {
  AuthenticatedUserPersistenceRow,
  CredentialsPersistenceRow,
  SessionMapper,
} from '../../application/mappers/sessions/session-mapper.js';
import {
  UserAccountMapper,
  UserAccountPersistenceRow,
} from '../../application/mappers/users/user-account-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { PESSOA_NO_ESCOPO } from './sql/pessoa-escopo.js';
import { ACTIVE_PERIOD } from './sql/vigencia.js';

const SELECT_CREDENTIALS = `
  SELECT
    u.id::text    AS "ID",
    p.nome        AS "NOME",
    u.email::text AS "EMAIL",
    u.senha_hash  AS "SENHA_HASH"
  FROM usuario u
  INNER JOIN pessoa p ON p.id = u.pessoa_id
  WHERE u.email = @email
    AND u.ativo = true;
`;

const SELECT_AUTHENTICATED = `
  SELECT
    u.id::text    AS "ID",
    p.nome        AS "NOME",
    u.email::text AS "EMAIL",
    f.codigo      AS "PERFIL"
  FROM usuario u
  INNER JOIN pessoa p ON p.id = u.pessoa_id
  LEFT JOIN usuario_perfil up
    ON up.usuario_id = u.id
   AND up.data_inicio <= CURRENT_DATE
   AND ${ACTIVE_PERIOD('up')}
  LEFT JOIN perfil f ON f.id = up.perfil_id
  WHERE u.id = @userId::uuid
    AND u.ativo = true;
`;

// =============================================================================
// CADASTRO DE USUÁRIO
// =============================================================================
// Mesmo agregado (`usuario`), mesmo repositório — como manda o CLAUDE.md §2. O que muda é a
// pergunta: acima é autenticação, aqui é cadastro.

const PERFIS_VIGENTES = (alias: string): string => `
  SELECT array_agg(DISTINCT f.codigo)
  FROM usuario_perfil up
  INNER JOIN perfil f ON f.id = up.perfil_id
  WHERE up.usuario_id = ${alias}
    AND up.data_inicio <= CURRENT_DATE
    AND ${ACTIVE_PERIOD('up')}
`;

// `nomePessoa` é a **expressão** do nome, não um alias de tabela: na listagem ele vem da CTE
// já projetado (`pagina.nome_pessoa`), e no item vem do JOIN (`pes.nome`).
const COLUNAS_CADASTRO = (alias: string, nomePessoa: string): string => `
  ${alias}.id::text                 AS "ID",
  ${alias}.pessoa_id::text          AS "PESSOA_ID",
  ${nomePessoa}                     AS "NOME_PESSOA",
  ${alias}.email::text              AS "EMAIL",
  ${alias}.ativo                    AS "ATIVO",
  ${alias}.email_verificado         AS "EMAIL_VERIFICADO",
  ${alias}.ultimo_acesso_em         AS "ULTIMO_ACESSO_EM",
  (${PERFIS_VIGENTES(`${alias}.id`)}) AS "PERFIS"
`;

const FILTRO_CADASTRO = `
  INNER JOIN pessoa pes ON pes.id = u.pessoa_id
  WHERE pes.escola_id = ${escolaDoAtor()}
    AND (@active::boolean IS NULL OR u.ativo = @active::boolean)
    AND (
      @search::text IS NULL
      OR u.email::text ILIKE '%' || @search::text || '%'
      OR pes.nome ILIKE '%' || @search::text || '%'
    )
    AND (
      @profile::text IS NULL
      OR EXISTS (
        SELECT 1 FROM usuario_perfil up
        INNER JOIN perfil f ON f.id = up.perfil_id
        WHERE up.usuario_id = u.id AND f.codigo = @profile::text
          AND up.data_inicio <= CURRENT_DATE
          AND ${ACTIVE_PERIOD('up')}
      )
    )
    AND (@viewerId::uuid IS NULL OR u.pessoa_id IN (${PESSOA_NO_ESCOPO}))
`;

const SELECT_LIST_USERS = `
  WITH pagina AS (
    SELECT u.*, pes.nome AS nome_pessoa, count(*) OVER () AS total_registro
    FROM usuario u
    ${FILTRO_CADASTRO}
    ORDER BY pes.nome, u.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS_CADASTRO('pagina', 'pagina.nome_pessoa')},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.nome_pessoa, pagina.id;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_USERS_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM usuario u
  ${FILTRO_CADASTRO};
`;

const SELECT_USER_BY_ID = `
  SELECT ${COLUNAS_CADASTRO('u', 'pes.nome')}
  FROM usuario u
  INNER JOIN pessoa pes ON pes.id = u.pessoa_id
  WHERE u.id = @userId::uuid
    AND pes.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR u.pessoa_id IN (${PESSOA_NO_ESCOPO}));
`;

const SELECT_USER_ID_BY_PERSON = `
  SELECT u.id::text AS "ID" FROM usuario u WHERE u.pessoa_id = @personId::uuid;
`;

const SELECT_USER_ID_BY_EMAIL = `
  SELECT u.id::text AS "ID" FROM usuario u WHERE u.email = @email::citext;
`;

// `usuario.pessoa_id` é UNIQUE e `uq_usuario_email` também: o DO NOTHING cobre os dois, e o
// use-case consulta qual deles foi para dizer ao operador o que aconteceu.
const INSERT_USER = `
  INSERT INTO usuario (pessoa_id, email, senha_hash)
  SELECT p.id, @email::citext, @passwordHash::text
  FROM pessoa p
  WHERE p.id = @personId::uuid AND p.escola_id = ${escolaDoAtor()}
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE_USER = `
  UPDATE usuario u SET
    email         = coalesce(@email::citext, u.email),
    senha_hash    = coalesce(@passwordHash::text, u.senha_hash),
    ativo         = coalesce(@active::boolean, u.ativo),
    atualizado_em = now()
  WHERE u.id = @userId::uuid
    AND (
      @email::citext IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM usuario outro
        WHERE outro.email = @email::citext AND outro.id <> u.id
      )
    )
  RETURNING u.id::text AS "ID";
`;

const DELETE_SESSIONS = `DELETE FROM sessao WHERE usuario_id = @userId::uuid;`;

const REVOKE_TOKENS = `
  UPDATE api_token
  SET revogado_em = now(), revogado_por = @revokedBy::uuid
  WHERE usuario_id = @userId::uuid AND revogado_em IS NULL;
`;

interface UserIdRow {
  ID: string;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const rows = await this.db.query<CredentialsPersistenceRow>(SELECT_CREDENTIALS, { email });
    const first = rows[0];
    return first ? SessionMapper.credentialsFromPersistence(first) : null;
  }

  async findAuthenticatedById(userId: string): Promise<AuthenticatedUser | null> {
    const rows = await this.db.query<AuthenticatedUserPersistenceRow>(SELECT_AUTHENTICATED, {
      userId,
    });
    return SessionMapper.authenticatedFromPersistence(rows);
  }

  async list(filters: ListUsersFilters): Promise<ListUsersResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      search: filters.search,
      active: filters.active,
      profile: filters.profile,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<UserAccountPersistenceRow>(SELECT_LIST_USERS, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(UserAccountMapper.fromPersistence),
        pagination: paginationFromRow(first),
      };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_USERS_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(
    userId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<UserAccount | null> {
    const rows = await this.db.query<UserAccountPersistenceRow>(SELECT_USER_BY_ID, {
      userId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? UserAccountMapper.fromPersistence(first) : null;
  }

  async findIdByPersonId(personId: string): Promise<string | null> {
    const rows = await this.db.query<UserIdRow>(SELECT_USER_ID_BY_PERSON, { personId });
    return rows[0]?.ID ?? null;
  }

  async findIdByEmail(email: string): Promise<string | null> {
    const rows = await this.db.query<UserIdRow>(SELECT_USER_ID_BY_EMAIL, { email });
    return rows[0]?.ID ?? null;
  }

  async create(data: CreateUserData): Promise<string | null> {
    const rows = await this.db.query<UserIdRow>(INSERT_USER, {
      personId: data.personId,
      email: data.email,
      passwordHash: data.passwordHash,
      actorId: data.actorId,
    });

    return rows[0]?.ID ?? null;
  }

  async update(userId: string, data: UpdateUserData): Promise<boolean> {
    const rows = await this.db.query<UserIdRow>(UPDATE_USER, {
      userId,
      email: data.email ?? null,
      passwordHash: data.passwordHash ?? null,
      active: data.active ?? null,
    });

    return rows.length > 0;
  }

  // Chamado dentro de uma transação: as duas queries são sequenciais de propósito, porque a
  // transação vive em UMA conexão e duas em paralelo se atropelariam no mesmo client.
  async revokeAccess(userId: string, revokedBy: string): Promise<void> {
    await this.db.query(DELETE_SESSIONS, { userId });
    await this.db.query(REVOKE_TOKENS, { userId, revokedBy });
  }
}
