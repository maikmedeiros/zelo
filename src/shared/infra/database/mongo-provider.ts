import { Collection, Db, Document, MongoClient } from 'mongodb';
import { logger } from '@shared/utils/logger/index.js';

export interface MongoConfig {
  uri: string;
  database: string;
  /**
   * Teto para o driver escolher um servidor. O default do driver é 30s, o que fazia o boot
   * levar 35s quando o Mongo estava fora — inaceitável para uma dependência ACESSÓRIA, que
   * por definição não deve atrasar a subida da API. Falhe rápido e siga sem o log.
   */
  serverSelectionTimeoutMS?: number;
}

const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 3_000;

/**
 * Driver oficial, sem Mongoose. Duas características das quais o resto do sistema depende:
 *
 * 1. Pool LAZY — instanciar não conecta. Com o log desligado, nenhum socket é aberto.
 * 2. `getCollection()` é síncrono e TOLERANTE a falha: devolve `null` quando não há
 *    conexão, em vez de lançar. É isso que permite ao log de requisições desistir em
 *    silêncio sem transformar Mongo fora do ar em erro de request.
 */
export class MongoDatabase {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connecting: Promise<Db> | null = null;

  constructor(private readonly config: MongoConfig) {}

  async connect(): Promise<Db> {
    if (this.db) return this.db;

    // `connecting` evita abrir 2 pools em chamadas concorrentes antes do 1º connect() resolver.
    if (!this.connecting) {
      this.connecting = MongoClient.connect(this.config.uri, {
        serverSelectionTimeoutMS:
          this.config.serverSelectionTimeoutMS ?? DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
      })
        .then((client) => {
          this.client = client;
          this.db = client.db(this.config.database);
          this.connecting = null;
          return this.db;
        })
        .catch((err) => {
          this.connecting = null;
          throw err;
        });
    }

    return this.connecting;
  }

  getCollection<T extends Document = Document>(name: string): Collection<T> | null {
    if (!this.db) return null;
    return this.db.collection<T>(name);
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
    logger.debug('Conexão com o MongoDB encerrada');
  }
}
