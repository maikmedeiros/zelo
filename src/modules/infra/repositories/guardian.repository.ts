import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Guardian } from '../../domain/entities/guardian.js';
import {
  CreateGuardianData,
  IGuardianRepository,
  ListGuardiansFilters,
  ListGuardiansResult,
  UpdateGuardianData,
} from '../../domain/repositories/i-guardian-repository.js';
import {
  GuardianMapper,
  GuardianPersistenceRow,
} from '../../application/mappers/guardians/guardian-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, alunoVisivelParaAtor } from './sql/turma-escopo.js';

const COLUNAS = (alias: string, pessoa: string): string => `
  ${alias}.id::text        AS "ID",
  ${alias}.pessoa_id::text AS "PESSOA_ID",
  ${pessoa}.nome           AS "NOME_PESSOA",
  ${pessoa}.cpf            AS "CPF",
  ${pessoa}.telefone       AS "TELEFONE",
  ${pessoa}.email_contato::text AS "EMAIL_CONTATO",
  ${alias}.receber_email   AS "RECEBER_EMAIL",
  ${alias}.receber_push    AS "RECEBER_PUSH",
  (
    SELECT count(*) FROM responsavel_aluno ra
    WHERE ra.responsavel_id = ${alias}.id AND ${ACTIVE_PERIOD('ra')}
  )::int                   AS "TOTAL_ALUNO"
`;

// O responsável entra no escopo pelas crianças que ele responde: quem enxerga a criança
// enxerga quem responde por ela. É o mesmo recorte de `alunoVisivelParaAtor`, aplicado um
// salto adiante — sem ele, um professor listaria os responsáveis da escola inteira.
const FILTRO = `
  INNER JOIN pessoa pes ON pes.id = r.pessoa_id
  WHERE pes.escola_id = ${escolaDoAtor()}
    AND (
      @studentId::uuid IS NULL
      OR EXISTS (
        SELECT 1 FROM responsavel_aluno ra
        WHERE ra.responsavel_id = r.id AND ra.aluno_id = @studentId::uuid AND ${ACTIVE_PERIOD('ra')}
      )
    )
    AND (
      @search::text IS NULL
      OR pes.nome ILIKE '%' || @search::text || '%'
      OR pes.cpf = @search::text
    )
    AND (
      @viewerId::uuid IS NULL
      OR r.pessoa_id = (SELECT us.pessoa_id FROM usuario us WHERE us.id = @viewerId::uuid)
      OR EXISTS (
        SELECT 1 FROM responsavel_aluno ra
        WHERE ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
          AND (${alunoVisivelParaAtor('ra.aluno_id')})
      )
    )
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT r.*, pes.nome, pes.cpf, pes.telefone, pes.email_contato,
           count(*) OVER () AS total_registro
    FROM responsavel r
    ${FILTRO}
    ORDER BY pes.nome, r.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS('pagina', 'pagina')},
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
  FROM responsavel r
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('r', 'pes')}
  FROM responsavel r
  INNER JOIN pessoa pes ON pes.id = r.pessoa_id
  WHERE r.id = @guardianId::uuid
    AND pes.escola_id = ${escolaDoAtor()}
    AND (
      @viewerId::uuid IS NULL
      OR r.pessoa_id = (SELECT us.pessoa_id FROM usuario us WHERE us.id = @viewerId::uuid)
      OR EXISTS (
        SELECT 1 FROM responsavel_aluno ra
        WHERE ra.responsavel_id = r.id AND ${ACTIVE_PERIOD('ra')}
          AND (${alunoVisivelParaAtor('ra.aluno_id')})
      )
    );
`;

const SELECT_ID_BY_PERSON = `
  SELECT r.id::text AS "ID" FROM responsavel r WHERE r.pessoa_id = @personId::uuid;
`;

// `responsavel.pessoa_id` é UNIQUE: recordset vazio significa que a pessoa já é responsável.
const INSERT = `
  INSERT INTO responsavel (pessoa_id, receber_email, receber_push)
  SELECT p.id, @receiveEmail::boolean, @receivePush::boolean
  FROM pessoa p
  WHERE p.id = @personId::uuid AND p.escola_id = ${escolaDoAtor()}
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE responsavel r SET
    receber_email = coalesce(@receiveEmail::boolean, r.receber_email),
    receber_push  = coalesce(@receivePush::boolean, r.receber_push),
    atualizado_em = now()
  WHERE r.id = @guardianId::uuid
  RETURNING r.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class GuardianRepository implements IGuardianRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListGuardiansFilters): Promise<ListGuardiansResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      studentId: filters.studentId,
      search: filters.search,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<GuardianPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(GuardianMapper.fromPersistence),
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
    guardianId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Guardian | null> {
    const rows = await this.db.query<GuardianPersistenceRow>(SELECT_BY_ID, {
      guardianId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? GuardianMapper.fromPersistence(first) : null;
  }

  async findIdByPersonId(personId: string): Promise<string | null> {
    const rows = await this.db.query<IdRow>(SELECT_ID_BY_PERSON, { personId });
    return rows[0]?.ID ?? null;
  }

  async create(data: CreateGuardianData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      personId: data.personId,
      receiveEmail: data.receiveEmail,
      receivePush: data.receivePush,
      actorId: data.actorId,
    });

    return rows[0]?.ID ?? null;
  }

  async update(guardianId: string, data: UpdateGuardianData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      guardianId,
      receiveEmail: data.receiveEmail ?? null,
      receivePush: data.receivePush ?? null,
    });

    return rows.length > 0;
  }
}
