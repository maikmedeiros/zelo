import { LocalFileStorage } from '@shared/infra/storage/index.js';
import { env } from './env.js';

export const storage = new LocalFileStorage(env.storage.root); // TODO(cdn): trocar aqui
