/**
 * A capability transacional isolada do resto: é só isso que um use-case precisa enxergar
 * para agrupar escritas de vários repositórios numa única transação.
 */
export interface IDatabaseTransaction {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
