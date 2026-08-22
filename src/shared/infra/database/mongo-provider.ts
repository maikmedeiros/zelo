import { Collection, Db, Document, MongoClient } from 'mongodb';
import { logger } from '@shared/utils/logger/index.js';

export interface MongoConfig {
  uri: string;
  database: string;
  serverSelectionTimeoutMS?: number;
}

const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 3_000;

export class MongoDatabase {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connecting: Promise<Db> | null = null;

  constructor(private readonly config: MongoConfig) {}

  async connect(): Promise<Db> {
    if (this.db) return this.db;

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
