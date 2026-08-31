import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { Consent } from '../../domain/entities/consent.js';
import {
  CreateConsentData,
  IConsentRepository,
  ListConsentsFilters,
  ListConsentsResult,
} from '../../domain/repositories/i-consent-repository.js';
import {
  ConsentMapper,
  ConsentPersistenceRow,
} from '../../application/mappers/students/consents/consent-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { alunoVisivelParaAtor } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN aluno al    ON al.id = c.aluno_id
  INNER JOIN pessoa pa   ON pa.id = al.pessoa_id
  INNER JOIN usuario ur  ON ur.id = c.registrado_por
  INNER JOIN pessoa pg   ON pg.id = ur.pessoa_id
  LEFT JOIN responsavel r ON r.id = c.responsavel_id
  LEFT JOIN pessoa pr     ON pr.id = r.pessoa_id
`;

const FILTRO = `
  ${JOINS}
  WHERE pa.escola_id = ${escolaDoAtor()}
    AND c.aluno_id = @studentId::uuid
    AND (@type::text IS NULL OR c.tipo = @type::tipo_consentimento)
    AND (
      @current::boolean IS NULL
      OR (@current::boolean AND c.vigencia_fim IS NULL)
      OR (NOT @current::boolean AND c.vigencia_fim IS NOT NULL)
    )
    AND (${alunoVisivelParaAtor('c.aluno_id')})
`;

const PROJECAO = `
  c.id::text              AS "ID",
  c.aluno_id::text        AS "ALUNO_ID",
  c.tipo::text            AS "TIPO",
  c.concedido             AS "CONCEDIDO",
  c.origem::text          AS "ORIGEM",
  c.registrado_por::text  AS "REGISTRADO_POR",
  pg.nome                 AS "NOME_REGISTRADOR",
  c.responsavel_id::text  AS "RESPONSAVEL_ID",
  pr.nome                 AS "NOME_RESPONSAVEL",
  c.documento_chave       AS "DOCUMENTO_CHAVE",
  c.observacao            AS "OBSERVACAO",
  c.vigencia_inicio       AS "VIGENCIA_INICIO",
  c.vigencia_fim          AS "VIGENCIA_FIM",
  c.criado_em             AS "CRIADO_EM"
`;

const ORDEM = `ORDER BY c.vigencia_inicio DESC, c.id`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                             AS "PAGINA_ATUAL",
    @limit::int                                            AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                  AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM consentimento c
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
  FROM consentimento c
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM consentimento c
  ${JOINS}
  WHERE c.id = @consentId::uuid
    AND c.aluno_id = @studentId::uuid
    AND pa.escola_id = ${escolaDoAtor()}
    AND (${alunoVisivelParaAtor('c.aluno_id')});
`;

const FECHAR_VIGENTE = `
  UPDATE consentimento c
  SET vigencia_fim = greatest(now(), c.vigencia_inicio + interval '1 microsecond')
  WHERE c.aluno_id = @studentId::uuid
    AND c.tipo = @type::tipo_consentimento
    AND c.vigencia_fim IS NULL
  RETURNING c.id::text AS "ID";
`;

const INSERT = `
  WITH novo AS (
    INSERT INTO consentimento
      (aluno_id, tipo, concedido, registrado_por, responsavel_id, origem, documento_chave, observacao)
    VALUES (
      @studentId::uuid,
      @type::tipo_consentimento,
      @granted::boolean,
      @recordedBy::uuid,
      @guardianId::uuid,
      @origin::origem_consentimento,
      @documentKey::text,
      @note::text
    )
    RETURNING *
  )
  SELECT ${PROJECAO}
  FROM novo c
  INNER JOIN usuario ur   ON ur.id = c.registrado_por
  INNER JOIN pessoa pg    ON pg.id = ur.pessoa_id
  LEFT JOIN responsavel r ON r.id = c.responsavel_id
  LEFT JOIN pessoa pr     ON pr.id = r.pessoa_id;
`;

const REVOKE = `
  UPDATE consentimento c
  SET vigencia_fim = greatest(now(), c.vigencia_inicio + interval '1 microsecond')
  WHERE c.id = @consentId::uuid
    AND c.aluno_id = @studentId::uuid
    AND c.vigencia_fim IS NULL
  RETURNING c.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class ConsentRepository implements IConsentRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListConsentsFilters): Promise<ListConsentsResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      studentId: filters.studentId,
      type: filters.type,
      current: filters.current,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<ConsentPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(ConsentMapper.fromPersistence),
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
    consentId: string,
    studentId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<Consent | null> {
    const rows = await this.db.query<ConsentPersistenceRow>(SELECT_BY_ID, {
      consentId,
      studentId,
      actorId,
      viewerId,
    });

    const row = rows[0];
    return row ? ConsentMapper.fromPersistence(row) : null;
  }

  async create(data: CreateConsentData): Promise<Consent> {
    return this.db.transaction(async () => {
      await this.db.query<IdRow>(FECHAR_VIGENTE, {
        studentId: data.studentId,
        type: data.type,
      });

      const rows = await this.db.query<ConsentPersistenceRow>(INSERT, {
        studentId: data.studentId,
        type: data.type,
        granted: data.granted,
        recordedBy: data.recordedBy,
        guardianId: data.guardianId,
        origin: data.origin,
        documentKey: data.documentKey,
        note: data.note,
      });

      const row = rows[0];
      if (!row) throw new Error('INSERT de consentimento não devolveu linha');

      return ConsentMapper.fromPersistence(row);
    });
  }

  async revoke(consentId: string, studentId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { consentId, studentId });
    return rows.length > 0;
  }
}
