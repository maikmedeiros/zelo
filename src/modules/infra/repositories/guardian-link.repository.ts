import {
  PaginatedRow,
  PostgresDatabase,
  emptyPagination,
  paginationFromRow,
} from '@shared/infra/database/index.js';
import { GuardianLink } from '../../domain/entities/guardian-link.js';
import {
  CreateGuardianLinkData,
  IGuardianLinkRepository,
  ListGuardianLinksFilters,
  ListGuardianLinksResult,
  UpdateGuardianLinkData,
} from '../../domain/repositories/i-guardian-link-repository.js';
import {
  GuardianLinkMapper,
  GuardianLinkPersistenceRow,
} from '../../application/mappers/guardian-links/guardian-link-mapper.js';
import { escolaDoAtor } from './sql/escola-do-ator.js';
import { alunoVisivelParaAtor } from './sql/turma-escopo.js';

const JOINS = `
  INNER JOIN responsavel r ON r.id = ra.responsavel_id
  INNER JOIN pessoa pr     ON pr.id = r.pessoa_id
  INNER JOIN aluno al      ON al.id = ra.aluno_id
  INNER JOIN pessoa pa     ON pa.id = al.pessoa_id
`;

// Vínculo de responsável é dado da criança: o recorte é o de `GET /students`.
const FILTRO = `
  ${JOINS}
  WHERE pa.escola_id = ${escolaDoAtor()}
    AND (@guardianId::uuid IS NULL OR ra.responsavel_id = @guardianId::uuid)
    AND (@studentId::uuid IS NULL OR ra.aluno_id = @studentId::uuid)
    AND (
      @active::boolean IS NULL
      OR (@active::boolean AND ra.data_fim IS NULL)
      OR (NOT @active::boolean AND ra.data_fim IS NOT NULL)
    )
    AND (${alunoVisivelParaAtor('ra.aluno_id')})
`;

const PROJECAO = `
  ra.id::text                                 AS "ID",
  ra.responsavel_id::text                     AS "RESPONSAVEL_ID",
  pr.nome                                     AS "NOME_RESPONSAVEL",
  ra.aluno_id::text                           AS "ALUNO_ID",
  pa.nome                                     AS "NOME_ALUNO",
  ra.parentesco::text                         AS "PARENTESCO",
  ra.pode_consentir                           AS "PODE_CONSENTIR",
  ra.financeiro                               AS "FINANCEIRO",
  to_char(ra.data_inicio, 'YYYY-MM-DD')       AS "DATA_INICIO",
  to_char(ra.data_fim, 'YYYY-MM-DD')          AS "DATA_FIM"
`;

const SELECT_LIST = `
  SELECT
    ${PROJECAO},
    @page::int                                                  AS "PAGINA_ATUAL",
    @limit::int                                                 AS "LIMITE_PAGINA",
    count(*) OVER ()::int                                       AS "TOTAL_REGISTRO",
    ceil(count(*) OVER ()::numeric / @limit::numeric)::int       AS "TOTAL_PAGINA"
  FROM responsavel_aluno ra
  ${FILTRO}
  ORDER BY pa.nome, pr.nome, ra.id
  LIMIT @limit::int OFFSET @offset::int;
`;

// Só roda quando a página vem vazia: separa "coleção vazia" de "passei do fim".
const SELECT_LIST_COUNT = `
  SELECT
    @page::int                                      AS "PAGINA_ATUAL",
    @limit::int                                     AS "LIMITE_PAGINA",
    count(*)::int                                   AS "TOTAL_REGISTRO",
    ceil(count(*)::numeric / @limit::numeric)::int  AS "TOTAL_PAGINA"
  FROM responsavel_aluno ra
  ${FILTRO};
`;

const SELECT_BY_ID = `
  SELECT ${PROJECAO}
  FROM responsavel_aluno ra
  ${JOINS}
  WHERE ra.id = @linkId::uuid
    AND pa.escola_id = ${escolaDoAtor()}
    AND (${alunoVisivelParaAtor('ra.aluno_id')});
`;

// `uq_responsavel_aluno_ativo` é índice PARCIAL (`WHERE data_fim IS NULL`): revincular quem
// já foi responsável e deixou de ser é legítimo; vínculo vigente duplicado não.
const INSERT = `
  INSERT INTO responsavel_aluno
    (responsavel_id, aluno_id, parentesco, pode_consentir, financeiro, data_inicio)
  VALUES (
    @guardianId::uuid,
    @studentId::uuid,
    @relationship::parentesco,
    @canConsent::boolean,
    @financial::boolean,
    coalesce(@startDate::date, CURRENT_DATE)
  )
  ON CONFLICT DO NOTHING
  RETURNING id::text AS "ID";
`;

const UPDATE = `
  UPDATE responsavel_aluno ra SET
    parentesco     = coalesce(@relationship::parentesco, ra.parentesco),
    pode_consentir = coalesce(@canConsent::boolean, ra.pode_consentir),
    financeiro     = coalesce(@financial::boolean, ra.financeiro)
  WHERE ra.id = @linkId::uuid
  RETURNING ra.id::text AS "ID";
`;

// Encerrar, não apagar: o consentimento assinado por este responsável continua tendo de
// apontar para o vínculo que o autorizava na data em que foi dado.
const REVOKE = `
  UPDATE responsavel_aluno ra
  SET data_fim = CURRENT_DATE
  WHERE ra.id = @linkId::uuid AND ra.data_fim IS NULL
  RETURNING ra.id::text AS "ID";
`;

interface IdRow {
  ID: string;
}

export class GuardianLinkRepository implements IGuardianLinkRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async list(filters: ListGuardianLinksFilters): Promise<ListGuardianLinksResult> {
    const variables = {
      page: filters.page,
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      guardianId: filters.guardianId,
      studentId: filters.studentId,
      active: filters.active,
      actorId: filters.actorId,
      viewerId: filters.viewerId,
    };

    const rows = await this.db.query<GuardianLinkPersistenceRow>(SELECT_LIST, variables);

    const first = rows[0];
    if (first) {
      return {
        items: rows.map(GuardianLinkMapper.fromPersistence),
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
    linkId: string,
    actorId: string,
    viewerId: string | null,
  ): Promise<GuardianLink | null> {
    const rows = await this.db.query<GuardianLinkPersistenceRow>(SELECT_BY_ID, {
      linkId,
      actorId,
      viewerId,
    });
    const first = rows[0];

    return first ? GuardianLinkMapper.fromPersistence(first) : null;
  }

  async create(data: CreateGuardianLinkData): Promise<string | null> {
    const rows = await this.db.query<IdRow>(INSERT, {
      guardianId: data.guardianId,
      studentId: data.studentId,
      relationship: data.relationship,
      canConsent: data.canConsent,
      financial: data.financial,
      startDate: data.startDate,
    });

    return rows[0]?.ID ?? null;
  }

  async update(linkId: string, data: UpdateGuardianLinkData): Promise<boolean> {
    const rows = await this.db.query<IdRow>(UPDATE, {
      linkId,
      relationship: data.relationship ?? null,
      canConsent: data.canConsent ?? null,
      financial: data.financial ?? null,
    });

    return rows.length > 0;
  }

  async revoke(linkId: string): Promise<boolean> {
    const rows = await this.db.query<IdRow>(REVOKE, { linkId });
    return rows.length > 0;
  }
}
