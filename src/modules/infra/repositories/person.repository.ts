import { Scope } from '@shared/auth/index.js';
import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Person } from '../../domain/entities/person.js';
import {
  CreatePersonData,
  IPersonRepository,
  ListPeopleFilters,
  ListPeopleResult,
  UpdatePersonData,
} from '../../domain/repositories/i-person-repository.js';
import {
  PersonMapper,
  PersonPersistenceRow,
} from '../../application/mappers/people/person-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { pessoaDoAtor } from './sql/pessoa-do-ator.js';
import { alunoVisivelParaAtor } from './sql/turma-escopo.js';
import { PESSOA_NO_ESCOPO } from './sql/pessoa-escopo.js';

const E_ALUNO = (alias: string): string =>
  `EXISTS (SELECT 1 FROM aluno al WHERE al.pessoa_id = ${alias}.id)`;
const E_RESPONSAVEL = (alias: string): string =>
  `EXISTS (SELECT 1 FROM responsavel re WHERE re.pessoa_id = ${alias}.id)`;
const E_PROFESSOR = (alias: string): string =>
  `EXISTS (SELECT 1 FROM professor pf WHERE pf.pessoa_id = ${alias}.id)`;

const COLUNAS = (alias: string): string => `
  ${alias}.id::text                                 AS "ID",
  ${alias}.nome                                     AS "NOME",
  ${alias}.nome_social                              AS "NOME_SOCIAL",
  to_char(${alias}.data_nascimento, 'YYYY-MM-DD')   AS "DATA_NASCIMENTO",
  ${alias}.cpf                                      AS "CPF",
  ${alias}.telefone                                 AS "TELEFONE",
  ${alias}.email_contato::text                      AS "EMAIL_CONTATO",
  ${E_ALUNO(alias)}                                 AS "E_ALUNO",
  ${E_RESPONSAVEL(alias)}                           AS "E_RESPONSAVEL",
  ${E_PROFESSOR(alias)}                             AS "E_PROFESSOR",
  EXISTS (SELECT 1 FROM usuario us2 WHERE us2.pessoa_id = ${alias}.id) AS "TEM_USUARIO",
  (${alias}.foto_chave IS NOT NULL)                 AS "TEM_FOTO"
`;

// `unaccent` não está instalado, então a busca por nome é ILIKE simples. Serve ao caso real
// — o operador digita o começo do nome —, e trocar por busca textual é mudança local.
const FILTRO = `
  WHERE p.escola_id = ${escolaDoAtor()}
    AND (@cpf::text IS NULL OR p.cpf = @cpf::text)
    AND (
      @search::text IS NULL
      OR p.nome ILIKE '%' || @search::text || '%'
      OR p.nome_social ILIKE '%' || @search::text || '%'
    )
    AND (
      @role::text IS NULL
      OR (@role::text = 'student'  AND ${E_ALUNO('p')})
      OR (@role::text = 'guardian' AND ${E_RESPONSAVEL('p')})
      OR (@role::text = 'teacher'  AND ${E_PROFESSOR('p')})
      OR (
        @role::text = 'none'
        AND NOT ${E_ALUNO('p')} AND NOT ${E_RESPONSAVEL('p')} AND NOT ${E_PROFESSOR('p')}
      )
    )
    AND (@viewerId::uuid IS NULL OR p.id IN (${PESSOA_NO_ESCOPO}))
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT p.*, count(*) OVER () AS total_registro
    FROM pessoa p
    ${FILTRO}
    ORDER BY p.nome, p.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS('pagina')},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.nome, pagina.id;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pessoa p
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('p')}
  FROM pessoa p
  WHERE p.id = @personId::uuid
    AND p.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR p.id IN (${PESSOA_NO_ESCOPO}));
`;

// `ON CONFLICT DO NOTHING` cobre `uq_pessoa_cpf` — e só ele é único aqui. Recordset vazio
// significa CPF já cadastrado, que o use-case traduz em 409 com o id de quem já o tem.
const INSERT = `
  INSERT INTO pessoa (escola_id, nome, nome_social, data_nascimento, cpf, telefone, email_contato)
  VALUES (
    ${escolaDoAtor()},
    @name::text,
    @socialName::text,
    @birthDate::date,
    @cpf::text,
    @phone::text,
    @contactEmail::citext
  )
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// `@xSet` distingue "não veio no PATCH" de "veio null": os campos são anuláveis, e coalesce
// sozinho não saberia a diferença. A guarda de CPF é a mesma ideia do UPDATE de turma.
const UPDATE = `
  UPDATE pessoa p SET
    nome            = coalesce(@name::text, p.nome),
    nome_social     = CASE WHEN @socialNameSet   THEN @socialName::text     ELSE p.nome_social END,
    data_nascimento = CASE WHEN @birthDateSet    THEN @birthDate::date      ELSE p.data_nascimento END,
    cpf             = CASE WHEN @cpfSet          THEN @cpf::text            ELSE p.cpf END,
    telefone        = CASE WHEN @phoneSet        THEN @phone::text          ELSE p.telefone END,
    email_contato   = CASE WHEN @contactEmailSet THEN @contactEmail::citext ELSE p.email_contato END,
    atualizado_em   = now()
  WHERE p.id = @personId::uuid
    AND (
      NOT @cpfSet
      OR @cpf::text IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM pessoa outra
        WHERE outra.escola_id = p.escola_id AND outra.cpf = @cpf::text AND outra.id <> p.id
      )
    )
  RETURNING p.id::text AS "ID";
`;

// Quem já tem o CPF. Sem isto o 409 diria "já existe" e deixaria o operador procurando —
// que é exatamente o atrito que empurra para o "cadastro de novo" e cria a duplicata.
const SELECT_ID_BY_CPF = `
  SELECT p.id::text AS "ID"
  FROM pessoa p
  WHERE p.cpf = @cpf::text AND p.escola_id = ${escolaDoAtor()};
`;

// O mesmo recorte do SELECT_BY_ID: quem pode ver a pessoa pode ver o rosto dela.
const SELECT_PHOTO_KEY = `
  SELECT p.foto_chave AS "FOTO_CHAVE"
  FROM pessoa p
  WHERE p.id = @personId::uuid
    AND p.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR p.id IN (${PESSOA_NO_ESCOPO}));
`;

// A abrangência decide o alcance. `ESCOLA` dispensa a checagem; abaixo dela vale sempre a
// própria pessoa — o salto de `usuario.id` para `pessoa.id` está em sql/pessoa-do-ator.ts —
// e `TURMA` acrescenta a criança que o ator alcança.
//
// "Alcança" é o vínculo, não a turma: `alunoVisivelParaAtor` separa o responsável, que chega
// pelo filho, da equipe, que chega pela turma. É o que impede o pai de trocar a foto do
// coleguinha do filho, sendo que os dois estudam na mesma sala.
const UPDATE_PHOTO_KEY = `
  UPDATE pessoa p SET
    foto_chave    = @key::text,
    atualizado_em = now()
  WHERE p.id = @personId::uuid
    AND p.escola_id = ${escolaDoAtor()}
    AND (
      @scope::text = 'ESCOLA'
      OR p.id = ${pessoaDoAtor()}
      OR (
        @scope::text = 'TURMA'
        AND EXISTS (
          SELECT 1 FROM aluno al
          WHERE al.pessoa_id = p.id AND (${alunoVisivelParaAtor('al.id')})
        )
      )
    )
  RETURNING p.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface PhotoKeyRow {
  FOTO_CHAVE: string | null;
}

export class PersonRepository implements IPersonRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListPeopleFilters): Promise<ListPeopleResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      cpf: filters.cpf,
      search: filters.search,
      role: filters.role,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<PersonPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(PersonMapper.fromPersistence),
        pagination: paginationFromRow(first),
      };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(
    personId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Person | null> {
    const rows = await this.db.query<PersonPersistenceRow>(SELECT_BY_ID, {
      personId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? PersonMapper.fromPersistence(first) : null;
  }

  async findIdByCpf(cpf: string, actorId: string): Promise<string | null> {
    const rows = await this.db.query<IdRow>(SELECT_ID_BY_CPF, { cpf, actorId });
    return rows[0]?.ID ?? null;
  }

  async create(data: CreatePersonData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      actorId: data.actorId,
      name: data.name,
      socialName: data.socialName,
      birthDate: data.birthDate,
      cpf: data.cpf,
      phone: data.phone,
      contactEmail: data.contactEmail,
    });

    return rows[0]?.ID ?? null;
  }

  async update(personId: string, data: UpdatePersonData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      personId,
      name: data.name ?? null,
      socialName: data.socialName ?? null,
      socialNameSet: data.socialName !== undefined,
      birthDate: data.birthDate ?? null,
      birthDateSet: data.birthDate !== undefined,
      cpf: data.cpf ?? null,
      cpfSet: data.cpf !== undefined,
      phone: data.phone ?? null,
      phoneSet: data.phone !== undefined,
      contactEmail: data.contactEmail ?? null,
      contactEmailSet: data.contactEmail !== undefined,
    });

    return rows.length > 0;
  }

  async findPhotoKey(
    personId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<string | null> {
    const rows = await this.db.query<PhotoKeyRow>(SELECT_PHOTO_KEY, {
      personId,
      actorId,
      viewerId,
    });

    return rows[0]?.FOTO_CHAVE ?? null;
  }

  async updatePhotoKey(
    personId: string,
    key: string | null,
    actorId: string,
    scope: Scope,
  ): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE_PHOTO_KEY, {
      personId,
      key,
      actorId,
      // `alunoVisivelParaAtor` filtra por `@viewerId`, e aqui o observador é o próprio ator.
      viewerId: actorId,
      scope,
    });

    return rows.length > 0;
  }
}
