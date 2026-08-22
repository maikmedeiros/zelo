export interface Collection<T> {
  results: T[];
}

export const collection = <T>(results: T[]): Collection<T> => ({ results });
