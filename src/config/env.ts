import { config } from 'dotenv';
import { z } from 'zod';

config(); // 1º: .env (define NODE_ENV)
config({ path: `.env.${process.env.NODE_ENV}`, override: true }); // 2º: .env.<NODE_ENV>, COM override

// Variável presente mas vazia (`MONGO_URI=`) chega como '' e não como undefined, então
// `.default()`/`.optional()` não disparariam — normaliza antes de validar.
const blankAsUndefined = (v: unknown): unknown => (v === '' ? undefined : v);

const csvList = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  const list = v
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return list.length === 0 ? undefined : list;
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive(),
    // Base pública JÁ COM o prefixo de versão — é o que monta as URLs de mídia.
    PUBLIC_URL: z.url(),
    ALLOW_ORIGIN_LIST: z.preprocess(csvList, z.array(z.string().min(1)).default([])),

    API_KEY_PREFIX: z.string().min(1),
    // Enum fechado: um nome fora da lista seria um cookie que nenhuma outra aplicação lê —
    // 401 em loop, sem erro. Erra no boot em vez de em runtime.
    SESSION_COOKIE_NAME: z.enum(['ZELO_APP', 'ZELO_APP_STAGING', 'ZELO_APP_DEV']),
    SESSION_COOKIE_DOMAIN: z.preprocess(blankAsUndefined, z.string().min(1).optional()),

    PG_HOST: z.string().min(1).default('localhost'),
    PG_PORT: z.coerce.number().int().positive().default(5432),
    PG_USER: z.string().min(1),
    PG_PASSWORD: z.string().min(1),
    PG_DB_NAME: z.string().min(1),
    PG_SSL: z.preprocess(blankAsUndefined, z.stringbool().default(false)),
    PG_POOL_MAX: z.coerce.number().int().positive().default(10),
    SQL_LOG_STATEMENTS: z.preprocess(blankAsUndefined, z.stringbool().default(false)),

    STORAGE_ROOT: z.string().min(1).default('./uploads'),
    UPLOAD_MAX_FILE_SIZE: z.coerce.number().int().positive().default(10_485_760),

    MONGO_LOG_ACTIVE: z.preprocess(blankAsUndefined, z.stringbool().default(false)),
    MONGO_URI: z.preprocess(blankAsUndefined, z.string().min(1).optional()),
    MONGO_DB_NAME: z.preprocess(blankAsUndefined, z.string().min(1).optional()),
    MONGO_LOG_COLLECTION: z.preprocess(blankAsUndefined, z.string().min(1).default('logs')),
    MONGO_LOG_MAX_BODY_SIZE: z.preprocess(
      blankAsUndefined,
      z.coerce.number().int().positive().default(10_240),
    ),
  })
  // Envs CONDICIONAIS: só quando o log está ligado, URI e DB_NAME passam a ser obrigatórias.
  .superRefine((values, ctx) => {
    if (!values.MONGO_LOG_ACTIVE) return;

    for (const key of ['MONGO_URI', 'MONGO_DB_NAME'] as const) {
      if (!values[key]) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'obrigatória quando MONGO_LOG_ACTIVE está ligada',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(raiz)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Variáveis de ambiente inválidas ou ausentes:\n${details}`);
}

const data = parsed.data;

// Exporta AGRUPADO por assunto — o resto do código nunca lê `process.env`.
export const env = {
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === 'production',
  port: data.PORT,
  publicUrl: data.PUBLIC_URL,
  cors: { allowedOrigins: data.ALLOW_ORIGIN_LIST },
  apiKey: { prefix: data.API_KEY_PREFIX },
  session: {
    cookieName: data.SESSION_COOKIE_NAME,
    cookieDomain: data.SESSION_COOKIE_DOMAIN,
  },
  pg: {
    host: data.PG_HOST,
    port: data.PG_PORT,
    user: data.PG_USER,
    password: data.PG_PASSWORD,
    database: data.PG_DB_NAME,
    ssl: data.PG_SSL,
    poolMax: data.PG_POOL_MAX,
    logStatements: data.SQL_LOG_STATEMENTS,
  },
  storage: {
    root: data.STORAGE_ROOT,
    maxFileSizeBytes: data.UPLOAD_MAX_FILE_SIZE,
  },
  mongo: {
    logEnabled: data.MONGO_LOG_ACTIVE,
    uri: data.MONGO_URI ?? '',
    database: data.MONGO_DB_NAME ?? '',
    collection: data.MONGO_LOG_COLLECTION,
    maxBodySizeBytes: data.MONGO_LOG_MAX_BODY_SIZE,
  },
} as const;
