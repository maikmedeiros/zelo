import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { JournalEntry, JournalEntryOwnership } from '../../domain/entities/journal-entry.js';
import {
  CreateJournalEntryData,
  IJournalEntryRepository,
  ListJournalEntriesFilters,
  ListJournalEntriesResult,
  RemoveJournalEntryData,
} from '../../domain/repositories/i-journal-entry-repository.js';
import {
  JournalEntryMapper,
  JournalEntryPersistenceRow,
} from '../../application/mappers/students/journal/journal-entry-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { ACTIVE_PERIOD, alunoVisivelParaAtor } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN aluno al  ON al.id = ae.aluno_id
  INNER JOIN pessoa pa ON pa.id = al.pessoa_id
  INNER JOIN turma t   ON t.id = ae.turma_id
  INNER JOIN usuario u ON u.id = ae.autor_id
  INNER JOIN pessoa pu ON pu.id = u.pessoa_id
`;

const FILTRO = `
  ${JOINS}
  WHERE pa.escola_id = ${escolaDoAtor()}
    AND ae.aluno_id = @studentId::uuid
    AND (@referenceDate::date IS NULL OR ae.data_referencia = @referenceDate::date)
    AND (${alunoVisivelParaAtor('ae.aluno_id')})
`;

const PROJECAO = `
  ae.id::text                                  AS "ID",
  ae.aluno_id::text                            AS "ALUNO_ID",
  ae.turma_id::text                            AS "TURMA_ID",
  t.nome                                       AS "NOME_TURMA",
  ae.autor_id::text                            AS "AUTOR_ID",
  pu.id::text                                  AS "AUTOR_PESSOA_ID",
  pu.nome                                      AS "NOME_AUTOR",
  ae.responde_a_id::text                       AS "RESPONDE_A_ID",
  CASE WHEN ae.status = 'PUBLICADA' THEN ae.texto END AS "TEXTO",
  to_char(ae.data_referencia, 'YYYY-MM-DD')    AS "DATA_REFERENCIA",
  ae.status::text                              AS "STATUS",
  ae.motivo_remocao                            AS "MOTIVO_REMOCAO",
  ae.removido_em                               AS "REMOVIDO_EM",
  ae.editado_em                                AS "EDITADO_EM",
  ae.criado_em                                 AS "CRIADO_EM"
`;

const ORDEM = `ORDER BY ae.data_referencia DESC, ae.criado_em ASC, ae.id`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM agenda_entrada ae
  ${FILTRO}
  ${ORDEM}
  LIMIT @limit::int OFFSET @offset::int;
`;

const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM agenda_entrada ae
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM agenda_entrada ae
  ${JOINS}
  WHERE ae.id = @entryId::uuid
    AND ae.aluno_id = @studentId::uuid
    AND pa.escola_id = ${escolaDoAtor()}
    AND (${alunoVisivelParaAtor('ae.aluno_id')});
`;

const SELECT_OWNERSHIP = `
  SELECT
    ae.id::text       AS "ID",
    ae.aluno_id::text AS "ALUNO_ID",
    ae.turma_id::text AS "TURMA_ID",
    ae.autor_id::text AS "AUTOR_ID",
    ae.status::text   AS "STATUS"
  FROM agenda_entrada ae
  WHERE ae.id = @entryId::uuid AND ae.aluno_id = @studentId::uuid;
`;

const INSERT = `
  WITH nova AS (
    INSERT INTO agenda_entrada
      (aluno_id, turma_id, autor_id, responde_a_id, texto, data_referencia)
    SELECT
      @studentId::uuid,
      m.turma_id,
      @authorId::uuid,
      @repliesToId::uuid,
      @text::text,
      coalesce(@referenceDate::date, current_date)
    FROM matricula m
    WHERE m.aluno_id = @studentId::uuid AND ${ACTIVE_PERIOD('m')}
    ORDER BY m.data_inicio DESC
    LIMIT 1
    RETURNING *
  )
  SELECT ${PROJECAO}
  FROM nova ae
  INNER JOIN turma t   ON t.id = ae.turma_id
  INNER JOIN usuario u ON u.id = ae.autor_id
  INNER JOIN pessoa pu ON pu.id = u.pessoa_id;
`;

const UPDATE = `
  UPDATE agenda_entrada ae
  SET texto = @text::text, editado_em = now()
  WHERE ae.id = @entryId::uuid
    AND ae.aluno_id = @studentId::uuid
    AND ae.status = 'PUBLICADA'
  RETURNING ae.id::text AS "ID";
`;

const REMOVE = `
  UPDATE agenda_entrada ae
  SET status = CASE WHEN @byAuthor::boolean THEN 'REMOVIDA_PELO_AUTOR'::status_agenda
                    ELSE 'REMOVIDA_PELA_ESCOLA'::status_agenda END,
      removido_por   = @removedBy::uuid,
      removido_em    = now(),
      motivo_remocao = @reason::text
  WHERE ae.id = @entryId::uuid
    AND ae.aluno_id = @studentId::uuid
    AND ae.status = 'PUBLICADA'
  RETURNING ae.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

interface OwnershipRow {
  ID: string;
  ALUNO_ID: string;
  TURMA_ID: string;
  AUTOR_ID: string;
  STATUS: JournalEntryOwnership['status'];
}

export class JournalEntryRepository implements IJournalEntryRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListJournalEntriesFilters): Promise<ListJournalEntriesResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      studentId: filters.studentId,
      referenceDate: filters.referenceDate,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<JournalEntryPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(JournalEntryMapper.fromPersistence),
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
    entryId: string,
    studentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<JournalEntry | null> {
    const rows = await this.db.query<JournalEntryPersistenceRow>(SELECT_BY_ID, {
      entryId,
      studentId,
      actorId,
      viewerId,
    });

    const row = rows[0];
    return row ? JournalEntryMapper.fromPersistence(row) : null;
  }

  async findOwnership(entryId: string, studentId: string): Promise<JournalEntryOwnership | null> {
    const rows = await this.db.query<OwnershipRow>(SELECT_OWNERSHIP, { entryId, studentId });
    const row = rows[0];

    if (!row) return null;

    return {
      id: row.ID,
      studentId: row.ALUNO_ID,
      classId: row.TURMA_ID,
      authorId: row.AUTOR_ID,
      status: row.STATUS,
    };
  }

  async create(data: CreateJournalEntryData): Promise<JournalEntry | null> {
    const rows = await this.db.query<JournalEntryPersistenceRow>(INSERT, {
      studentId: data.studentId,
      authorId: data.authorId,
      repliesToId: data.repliesToId,
      text: data.text,
      referenceDate: data.referenceDate,
    });

    const row = rows[0];
    return row ? JournalEntryMapper.fromPersistence(row) : null;
  }

  async update(entryId: string, studentId: string, text: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, { entryId, studentId, text });
    return rows.length > 0;
  }

  async remove(data: RemoveJournalEntryData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REMOVE, {
      entryId: data.entryId,
      studentId: data.studentId,
      removedBy: data.removedBy,
      byAuthor: data.byAuthor,
      reason: data.reason,
    });

    return rows.length > 0;
  }
}
