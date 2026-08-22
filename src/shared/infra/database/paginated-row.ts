import { Pagination } from '@shared/presenters/index.js';

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

export const emptyPagination = (page: number, limit: number): Pagination => ({
  page,
  limit,
  totalResults: 0,
  totalPages: 0,
});
