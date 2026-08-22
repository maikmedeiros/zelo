export interface IDatabaseTransaction {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
