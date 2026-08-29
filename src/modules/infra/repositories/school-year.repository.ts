import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { SchoolYear } from '../../domain/entities/school-year.js';
import {
  CreateSchoolYearData,
  ISchoolYearRepository,
  ListSchoolYearsFilters,
  ListSchoolYearsResult,
  UpdateSchoolYearData,
} from '../../domain/repositories/i-school-year-repository.js';
import {
  SchoolYearMapper,
  SchoolYearPersistenceRow,
} from '../../application/mappers/school-years/school-year-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';

const COLUNAS = (alias: string): string => `
  ${alias}.id::text                            AS "ID",
  ${alias}.ano                                 AS "ANO",
  to_char(${alias}.data_inicio, 'YYYY-MM-DD')  AS "DATA_INICIO",
  to_char(${alias}.data_fim, 'YYYY-MM-DD')     AS "DATA_FIM",
  (SELECT count(*) FROM turma t WHERE t.ano_letivo_id = ${alias}.id)::int AS "TOTAL_TURMA"
`;

const FILTRO = `
  WHERE al.escola_id = ${escolaDoAtor()}
    AND (@year::int IS NULL OR al.ano = @year::int)
`;

const SELECT_LIST = `
  WITH pagina AS (
    SELECT al.*, count(*) OVER () AS total_registro
    FROM ano_letivo al
    ${FILTRO}
    ORDER BY al.ano DESC
    LIMIT @limit::int OFFSET @offset::int
  )
  SELECT
    ${COLUNAS('pagina')},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    pagina.total_registro::int                                  AS "TOTAL_REGISTRO",
    ceil(pagina.total_registro::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM pagina
  ORDER BY pagina.ano DESC;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM ano_letivo al
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${COLUNAS('al')}
  FROM ano_letivo al
  WHERE al.id = @schoolYearId::uuid
    AND al.escola_id = ${escolaDoAtor()};
`;

// `ON CONFLICT DO NOTHING` transforma a violação de `uq_ano_letivo` em recordset vazio, e o
// use-case traduz em 409. Sem isso o erro do driver subiria como 500.
const INSERT = `
  INSERT INTO ano_letivo (escola_id, ano, data_inicio, data_fim)
  VALUES (${escolaDoAtor()}, @year::smallint, @startDate::date, @endDate::date)
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

// `ON CONFLICT` não existe para UPDATE, então a colisão com o irmão vira condição do WHERE.
// O use-case já leu o recurso antes (404), então zero linhas aqui só pode ser conflito.
const UPDATE = `
  UPDATE ano_letivo al SET
    ano         = coalesce(@year::smallint, al.ano),
    data_inicio = coalesce(@startDate::date, al.data_inicio),
    data_fim    = coalesce(@endDate::date, al.data_fim)
  WHERE al.id = @schoolYearId::uuid
    AND NOT EXISTS (
      SELECT 1 FROM ano_letivo outro
      WHERE outro.escola_id = al.escola_id
        AND outro.ano = coalesce(@year::smallint, al.ano)
        AND outro.id <> al.id
    )
  RETURNING al.id::text AS "ID";
`;

// `turma.ano_letivo_id` é ON DELETE RESTRICT: sem a guarda, a FK derrubaria a requisição com
// 500. Aqui zero linhas significa "ainda tem turma", e o use-case devolve 409.
const DELETE = `
  DELETE FROM ano_letivo al
  WHERE al.id = @schoolYearId::uuid
    AND NOT EXISTS (SELECT 1 FROM turma t WHERE t.ano_letivo_id = al.id)
  RETURNING al.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class SchoolYearRepository implements ISchoolYearRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListSchoolYearsFilters): Promise<ListSchoolYearsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      year: filters.year,
      actorId: filters.actorId,
    };

    const rows = await this.db.query<SchoolYearPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(SchoolYearMapper.fromPersistence),
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

  async findById(schoolYearId: string, actorId: string): Promise<SchoolYear | null> {
    const rows = await this.db.query<SchoolYearPersistenceRow>(SELECT_BY_ID, {
      schoolYearId,
      actorId,
    });
    const first = rows[0];

    return first ? SchoolYearMapper.fromPersistence(first) : null;
  }

  async create(data: CreateSchoolYearData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      actorId: data.actorId,
      year: data.year,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return rows[0]?.ID ?? null;
  }

  async update(schoolYearId: string, data: UpdateSchoolYearData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      schoolYearId,
      year: data.year ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });

    return rows.length > 0;
  }

  async delete(schoolYearId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(DELETE, { schoolYearId });
    return rows.length > 0;
  }
}
