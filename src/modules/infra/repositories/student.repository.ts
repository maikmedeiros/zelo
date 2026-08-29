import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Student } from '../../domain/entities/student.js';
import {
  CreateStudentData,
  IStudentRepository,
  ListStudentsFilters,
  ListStudentsResult,
  UpdateStudentData,
} from '../../domain/repositories/i-student-repository.js';
import {
  StudentMapper,
  StudentPersistenceRow,
} from '../../application/mappers/students/student-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, alunoVisivelParaAtor } from './sql/turma-escopo.js';

// A matrícula vigente. LATERAL porque o aluno pode ter histórico: pega a mais recente das
// que ainda valem.
const MATRICULA_VIGENTE = (alias: string): string => `
  LEFT JOIN LATERAL (
    SELECT m.turma_id, t.nome
    FROM matricula m
    INNER JOIN turma t ON t.id = m.turma_id
    WHERE m.aluno_id = ${alias}.id AND ${ACTIVE_PERIOD('m')}
    ORDER BY m.data_inicio DESC
    LIMIT 1
  ) mt ON true
`;

const COLUNAS = (alias: string, pessoa: string): string => `
  ${alias}.id::text                              AS "ID",
  ${alias}.pessoa_id::text                       AS "PESSOA_ID",
  ${pessoa}.nome                                 AS "NOME_PESSOA",
  to_char(${pessoa}.data_nascimento, 'YYYY-MM-DD') AS "DATA_NASCIMENTO",
  ${alias}.codigo                                AS "CODIGO",
  ${alias}.observacoes                           AS "OBSERVACOES",
  ${alias}.ativo                                 AS "ATIVO",
  mt.turma_id::text                              AS "TURMA_ID",
  mt.nome                                        AS "NOME_TURMA"
`;

// O recorte é o mesmo da postagem individual, e pelo mesmo motivo: o responsável alcança o
// aluno **pelo vínculo com ele**, a equipe **pela turma onde ele está matriculado**. Um
// único ramo por turma faria o pai de uma criança listar as outras crianças da sala.
const FILTRO = `
  INNER JOIN pessoa pes ON pes.id = a.pessoa_id
  ${MATRICULA_VIGENTE('a')}
  WHERE pes.escola_id = ${escolaDoAtor()}
    AND (@classId::uuid IS NULL OR mt.turma_id = @classId::uuid)
    AND (@active::boolean IS NULL OR a.ativo = @active::boolean)
    AND (
      @search::text IS NULL
      OR pes.nome ILIKE '%' || @search::text || '%'
      OR a.codigo ILIKE '%' || @search::text || '%'
    )
    AND (${alunoVisivelParaAtor('a.id')})
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT
      a.id, a.pessoa_id, a.codigo, a.observacoes, a.ativo,
      pes.nome AS nome_pessoa, pes.data_nascimento,
      mt.turma_id, mt.nome AS nome_turma,
      count(*) OVER () AS total_registro
    FROM aluno a
    ${FILTRO}
    ORDER BY pes.nome, a.id
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    pagina.id::text                                             AS "ID",
    pagina.pessoa_id::text                                      AS "PESSOA_ID",
    pagina.nome_pessoa                                          AS "NOME_PESSOA",
    to_char(pagina.data_nascimento, 'YYYY-MM-DD')               AS "DATA_NASCIMENTO",
    pagina.codigo                                               AS "CODIGO",
    pagina.observacoes                                          AS "OBSERVACOES",
    pagina.ativo                                                AS "ATIVO",
    pagina.turma_id::text                                       AS "TURMA_ID",
    pagina.nome_turma                                           AS "NOME_TURMA",
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.nome_pessoa, pagina.id;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM aluno a
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('a', 'pes')}
  FROM aluno a
  INNER JOIN pessoa pes ON pes.id = a.pessoa_id
  ${MATRICULA_VIGENTE('a')}
  WHERE a.id = @studentId::uuid
    AND pes.escola_id = ${escolaDoAtor()}
    AND (${alunoVisivelParaAtor('a.id')});
`;

const SELECT_ID_BY_PERSON = `
  SELECT a.id::text AS "ID" FROM aluno a WHERE a.pessoa_id = @personId::uuid;
`;

// `aluno.pessoa_id` é UNIQUE: recordset vazio significa que a pessoa já é aluna.
const INSERT = `
  INSERT INTO aluno (pessoa_id, codigo, observacoes)
  SELECT p.id, @code::text, @notes::text
  FROM pessoa p
  WHERE p.id = @personId::uuid AND p.escola_id = ${escolaDoAtor()}
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE aluno a SET
    codigo        = CASE WHEN @codeSet  THEN @code::text  ELSE a.codigo END,
    observacoes   = CASE WHEN @notesSet THEN @notes::text ELSE a.observacoes END,
    ativo         = coalesce(@active::boolean, a.ativo),
    atualizado_em = now()
  WHERE a.id = @studentId::uuid
  RETURNING a.id::text AS "ID";
`;

// Aluno que já foi matriculado, vinculado a responsável ou endereçado por postagem carrega
// histórico. O 409 empurra para `PATCH { active: false }`, que é o desligamento de verdade.
const DELETE = `
  DELETE FROM aluno a
  WHERE a.id = @studentId::uuid
    AND NOT EXISTS (SELECT 1 FROM matricula m         WHERE m.aluno_id = a.id)
    AND NOT EXISTS (SELECT 1 FROM responsavel_aluno r WHERE r.aluno_id = a.id)
    AND NOT EXISTS (SELECT 1 FROM postagem_aluno pa   WHERE pa.aluno_id = a.id)
  RETURNING a.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class StudentRepository implements IStudentRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListStudentsFilters): Promise<ListStudentsResult> {
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

    const rows = await this.db.query<StudentPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(StudentMapper.fromPersistence),
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
    studentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Student | null> {
    const rows = await this.db.query<StudentPersistenceRow>(SELECT_BY_ID, {
      studentId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? StudentMapper.fromPersistence(first) : null;
  }

  async findIdByPersonId(personId: string): Promise<string | null> {
    const rows = await this.db.query<IdRow>(SELECT_ID_BY_PERSON, { personId });
    return rows[0]?.ID ?? null;
  }

  async create(data: CreateStudentData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      personId: data.personId,
      code: data.code,
      notes: data.notes,
      actorId: data.actorId,
    });

    return rows[0]?.ID ?? null;
  }

  async update(studentId: string, data: UpdateStudentData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      studentId,
      code: data.code ?? null,
      codeSet: data.code !== undefined,
      notes: data.notes ?? null,
      notesSet: data.notes !== undefined,
      active: data.active ?? null,
    });

    return rows.length > 0;
  }

  async delete(studentId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { studentId });
    return rows.length > 0;
  }
}
