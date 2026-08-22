import { Pagination } from '@shared/presenters/index.js';

/**
 * Colunas que TODA query paginada devolve — a paginação vem PRONTA do banco.
 *
 * Identificador não-citado no PostgreSQL é dobrado para caixa baixa, então o alias da
 * query precisa vir entre aspas duplas (`AS "PAGINA_ATUAL"`) para manter o contrato de
 * linha em UPPER_SNAKE.
 */
export interface PaginatedRow {
  PAGINA_ATUAL: number;
  LIMITE_PAGINA: number;
  TOTAL_REGISTRO: number;
  TOTAL_PAGINA: number;
}

export const paginationFromRow = (row: PaginatedRow): Pagination => ({
  page: Number(row.PAGINA_ATUAL),
  limit: Number(row.LIMITE_PAGINA),
  totalResults: Number(row.TOTAL_REGISTRO),
  totalPages: Number(row.TOTAL_PAGINA),
});

/** Recordset vazio: devolve a página pedida com os totais zerados. */
export const emptyPagination = (page: number, limit: number): Pagination => ({
  page,
  limit,
  totalResults: 0,
  totalPages: 0,
});
