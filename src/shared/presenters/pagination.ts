export interface Pagination {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

export interface Paginated<T> extends Pagination {
  results: T[];
}

export const paginated = <T>(results: T[], pagination: Pagination): Paginated<T> => ({
  results,
  ...pagination,
});
