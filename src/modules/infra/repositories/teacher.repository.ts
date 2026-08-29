import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Teacher } from '../../domain/entities/teacher.js';
import {
  CreateTeacherData,
  ITeacherRepository,
  ListTeachersFilters,
  ListTeachersResult,
  UpdateTeacherData,
} from '../../domain/repositories/i-teacher-repository.js';
import {
  TeacherMapper,
  TeacherPersistenceRow,
} from '../../application/mappers/teachers/teacher-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, TURMA_NO_ESCOPO } from './sql/turma-escopo.js';

const COLUNAS = (alias: string, pessoa: string): string => `
  ${alias}.id::text        AS "ID",
  ${alias}.pessoa_id::text AS "PESSOA_ID",
  ${pessoa}.nome           AS "NOME_PESSOA",
  ${pessoa}.cpf            AS "CPF",
  ${alias}.registro        AS "REGISTRO",
  ${alias}.formacao        AS "FORMACAO",
  ${alias}.ativo           AS "ATIVO",
  (
    SELECT count(*) FROM professor_turma pt
    WHERE pt.professor_id = ${alias}.id AND ${ACTIVE_PERIOD('pt')}
  )::int                   AS "TOTAL_TURMA"
`;

// O professor entra no escopo pela turma: quem alcança a turma alcança quem dá aula nela.
// Aqui vale `TURMA_NO_ESCOPO` (as três origens) — saber o nome de quem cuida do filho é
// justamente o que o responsável precisa, e não expõe criança nenhuma.
const FILTRO = `
  INNER JOIN pessoa pes ON pes.id = p.pessoa_id
  WHERE pes.escola_id = ${escolaDoAtor()}
    AND (@active::boolean IS NULL OR p.ativo = @active::boolean)
    AND (
      @classId::uuid IS NULL
      OR EXISTS (
        SELECT 1 FROM professor_turma pt
        WHERE pt.professor_id = p.id AND pt.turma_id = @classId::uuid AND ${ACTIVE_PERIOD('pt')}
      )
    )
    AND (
      @search::text IS NULL
      OR pes.nome ILIKE '%' || @search::text || '%'
      OR p.registro ILIKE '%' || @search::text || '%'
    )
    AND (
      @viewerId::uuid IS NULL
      OR p.pessoa_id = (SELECT us.pessoa_id FROM usuario us WHERE us.id = @viewerId::uuid)
      OR EXISTS (
        SELECT 1 FROM professor_turma pt
        WHERE pt.professor_id = p.id AND ${ACTIVE_PERIOD('pt')}
          AND pt.turma_id IN (${TURMA_NO_ESCOPO})
      )
    )
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT p.*, pes.nome, pes.cpf, count(*) OVER () AS total_registro
    FROM professor p
    ${FILTRO}
    ORDER BY pes.nome, p.id
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
  FROM professor p
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('p', 'pes')}
  FROM professor p
  INNER JOIN pessoa pes ON pes.id = p.pessoa_id
  WHERE p.id = @teacherId::uuid
    AND pes.escola_id = ${escolaDoAtor()}
    AND (
      @viewerId::uuid IS NULL
      OR p.pessoa_id = (SELECT us.pessoa_id FROM usuario us WHERE us.id = @viewerId::uuid)
      OR EXISTS (
        SELECT 1 FROM professor_turma pt
        WHERE pt.professor_id = p.id AND ${ACTIVE_PERIOD('pt')}
          AND pt.turma_id IN (${TURMA_NO_ESCOPO})
      )
    );
`;

const SELECT_ID_BY_PERSON = `
  SELECT p.id::text AS "ID" FROM professor p WHERE p.pessoa_id = @personId::uuid;
`;

// `professor.pessoa_id` é UNIQUE: recordset vazio significa que a pessoa já é professora.
const INSERT = `
  INSERT INTO professor (pessoa_id, registro, formacao)
  SELECT pe.id, @registration::text, @education::text
  FROM pessoa pe
  WHERE pe.id = @personId::uuid AND pe.escola_id = ${escolaDoAtor()}
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE professor p SET
    registro      = CASE WHEN @registrationSet THEN @registration::text ELSE p.registro END,
    formacao      = CASE WHEN @educationSet    THEN @education::text    ELSE p.formacao END,
    ativo         = coalesce(@active::boolean, p.ativo),
    atualizado_em = now()
  WHERE p.id = @teacherId::uuid
  RETURNING p.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class TeacherRepository implements ITeacherRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListTeachersFilters): Promise<ListTeachersResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      classId: filters.classId,
      search: filters.search,
      active: filters.active,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<TeacherPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(TeacherMapper.fromPersistence),
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
    teacherId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Teacher | null> {
    const rows = await this.db.query<TeacherPersistenceRow>(SELECT_BY_ID, {
      teacherId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? TeacherMapper.fromPersistence(first) : null;
  }

  async findIdByPersonId(personId: string): Promise<string | null> {
    const rows = await this.db.query<IdRow>(SELECT_ID_BY_PERSON, { personId });
    return rows[0]?.ID ?? null;
  }

  async create(data: CreateTeacherData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      personId: data.personId,
      registration: data.registration,
      education: data.education,
      actorId: data.actorId,
    });

    return rows[0]?.ID ?? null;
  }

  async update(teacherId: string, data: UpdateTeacherData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      teacherId,
      registration: data.registration ?? null,
      registrationSet: data.registration !== undefined,
      education: data.education ?? null,
      educationSet: data.education !== undefined,
      active: data.active ?? null,
    });

    return rows.length > 0;
  }
}
