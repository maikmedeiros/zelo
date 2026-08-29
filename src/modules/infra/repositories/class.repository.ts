import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Class } from '../../domain/entities/class.js';
import {
  CreateClassData,
  IClassRepository,
  ListClassesFilters,
  ListClassesResult,
  UpdateClassData,
} from '../../domain/repositories/i-class-repository.js';
import {
  ClassMapper,
  ClassPersistenceRow,
} from '../../application/mappers/classes/class-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, TURMA_NO_ESCOPO } from './sql/turma-escopo.js';

const COLUNAS = (alias: string, ano: string): string => `
  ${alias}.id::text            AS "ID",
  ${alias}.nome                AS "NOME",
  ${alias}.segmento            AS "SEGMENTO",
  ${alias}.turno::text         AS "TURNO",
  ${alias}.ano_letivo_id::text AS "ANO_LETIVO_ID",
  ${ano}.ano                   AS "ANO",
  (
    SELECT count(*) FROM matricula m
    WHERE m.turma_id = ${alias}.id AND ${ACTIVE_PERIOD('m')}
  )::int                       AS "TOTAL_ALUNO"
`;

// As três origens de vínculo, não só as de equipe: o responsável enxerga a turma do filho
// pelo nome — é o rótulo que dá sentido ao feed dele. O nome da turma não é dado pessoal.
const FILTRO = `
  WHERE t.escola_id = ${escolaDoAtor()}
    AND (@schoolYearId::uuid IS NULL OR t.ano_letivo_id = @schoolYearId::uuid)
    AND (@shift::turno_turma IS NULL OR t.turno = @shift::turno_turma)
    AND (@viewerId::uuid IS NULL OR t.id IN (${TURMA_NO_ESCOPO}))
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT t.*, count(*) OVER () AS total_registro
    FROM turma t
    ${FILTRO}
    ORDER BY t.nome, t.turno
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS('pagina', 'al')},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  INNER JOIN ano_letivo al ON al.id = pagina.ano_letivo_id
  ORDER BY pagina.nome, pagina.turno;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM turma t
  ${FILTRO};
`;

// Fora do escopo o recordset vem vazio e o use-case traduz em 404. Recusar por permissão
// aqui confirmaria que a turma existe.
const SELECT_BY_ID = `
  SELECT ${COLUNAS('t', 'al')}
  FROM turma t
  INNER JOIN ano_letivo al ON al.id = t.ano_letivo_id
  WHERE t.id = @classId::uuid
    AND t.escola_id = ${escolaDoAtor()}
    AND (@viewerId::uuid IS NULL OR t.id IN (${TURMA_NO_ESCOPO}));
`;

// `escola_id` sai do ano letivo, e o ano letivo tem de ser da escola do ator: sem isso um
// operador cadastraria turma na escola do vizinho. Zero linhas por ano letivo inexistente
// não chega a acontecer — o use-case já o leu antes —, então é sempre `uq_turma`.
const INSERT = `
  INSERT INTO turma (escola_id, ano_letivo_id, nome, segmento, turno)
  SELECT al.escola_id, al.id, @name, @segment, @shift::turno_turma
  FROM ano_letivo al
  WHERE al.id = @schoolYearId::uuid AND al.escola_id = ${escolaDoAtor()}
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// `ON CONFLICT` não existe para UPDATE, então a colisão com a irmã vira condição do WHERE.
const UPDATE = `
  UPDATE turma t SET
    nome     = coalesce(@name, t.nome),
    segmento = coalesce(@segment, t.segmento),
    turno    = coalesce(@shift::turno_turma, t.turno)
  WHERE t.id = @classId::uuid
    AND NOT EXISTS (
      SELECT 1 FROM turma outra
      WHERE outra.ano_letivo_id = t.ano_letivo_id
        AND outra.nome = coalesce(@name, t.nome)
        AND outra.turno = coalesce(@shift::turno_turma, t.turno)
        AND outra.id <> t.id
    )
  RETURNING t.id::text AS "ID";
`;

// Todas as FKs para `turma` são ON DELETE RESTRICT: sem a guarda, o banco derrubaria a
// requisição com 500. Aqui zero linhas significa "a turma já foi usada", e vira 409.
// Matrícula e vínculo contam mesmo encerrados — o histórico é o que se está protegendo.
const DELETE = `
  DELETE FROM turma t
  WHERE t.id = @classId::uuid
    AND NOT EXISTS (SELECT 1 FROM matricula m       WHERE m.turma_id = t.id)
    AND NOT EXISTS (SELECT 1 FROM professor_turma p WHERE p.turma_id = t.id)
    AND NOT EXISTS (SELECT 1 FROM acesso_turma a    WHERE a.turma_id = t.id)
    AND NOT EXISTS (SELECT 1 FROM postagem_turma pt WHERE pt.turma_id = t.id)
  RETURNING t.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class ClassRepository implements IClassRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListClassesFilters): Promise<ListClassesResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      schoolYearId: filters.schoolYearId,
      shift: filters.shift,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<ClassPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return { items: rows.map(ClassMapper.fromPersistence), pagination: paginationFromRow(first) };
    }

    const totais = await this.db.query<PaginatedRow>(SELECT_LIST_COUNT, variables);
    const total = totais[0];

    return {
      items: [],
      pagination: total ? paginationFromRow(total) : emptyPagination(filters.page, filters.limit),
    };
  }

  async findById(classId: string, actorId: string, viewerId: string | null): Promise<Class | null> {
    const rows = await this.db.query<ClassPersistenceRow>(SELECT_BY_ID, {
      classId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? ClassMapper.fromPersistence(first) : null;
  }

  async create(data: CreateClassData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      schoolYearId: data.schoolYearId,
      name: data.name,
      segment: data.segment,
      shift: data.shift,
      actorId: data.actorId,
    });

    return rows[0]?.ID ?? null;
  }

  async update(classId: string, data: UpdateClassData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      classId,
      name: data.name ?? null,
      segment: data.segment ?? null,
      shift: data.shift ?? null,
    });

    return rows.length > 0;
  }

  async delete(classId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { classId });
    return rows.length > 0;
  }
}
