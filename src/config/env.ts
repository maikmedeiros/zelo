import { config } from 'dotenv';
import { z } from 'zod';

config();
config({ path: `.env.${process.env.NODE_ENV}`, override: true });

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
    PUBLIC_URL: z.url(),
    ALLOW_ORIGIN_LIST: z.preprocess(csvList, z.array(z.string().min(1)).default([])),

    API_TOKEN_PREFIX: z.string().min(1),
    SESSION_COOKIE_NAME: z.enum(['ZELO_APP', 'ZELO_APP_STAGING', 'ZELO_APP_DEV']),
    SESSION_COOKIE_DOMAIN: z.preprocess(blankAsUndefined, z.string().min(1).optional()),
    SESSION_IDLE_DAYS: z.coerce.number().int().positive().default(7),
    SESSION_MAX_DAYS: z.coerce.number().int().positive().default(30),

    PG_HOST: z.string().min(1).default('localhost'),
    PG_PORT: z.coerce.number().int().positive().default(5432),
    PG_USER: z.string().min(1),
    PG_PASSWORD: z.string().min(1),
    PG_DB_NAME: z.string().min(1),
    PG_SSL: z.preprocess(blankAsUndefined, z.stringbool().default(false)),
    PG_POOL_MAX: z.coerce.number().int().positive().default(10),
    SQL_LOG_STATEMENTS: z.preprocess(blankAsUndefined, z.stringbool().default(false)),
    DB_AUTO_MIGRATE: z.preprocess(blankAsUndefined, z.stringbool().optional()),

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
  .superRefine((values, ctx) => {
    if (values.SESSION_MAX_DAYS < values.SESSION_IDLE_DAYS) {
      ctx.addIssue({
        code: 'custom',
        path: ['SESSION_MAX_DAYS'],
        message: 'o teto absoluto não pode ser menor que a janela de inatividade',
      });
    }

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

export const env = {
  nodeEnv: data.NODE_ENV,
  isProduction: data.NODE_ENV === 'production',
  port: data.PORT,
  publicUrl: data.PUBLIC_URL,
  cors: { allowedOrigins: data.ALLOW_ORIGIN_LIST },
  apiToken: { prefix: data.API_TOKEN_PREFIX },
  session: {
    cookieName: data.SESSION_COOKIE_NAME,
    cookieDomain: data.SESSION_COOKIE_DOMAIN,
    idleDays: data.SESSION_IDLE_DAYS,
    maxDays: data.SESSION_MAX_DAYS,
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
    // Migrar a cada boot é conveniente em desenvolvimento e arriscado em produção, onde N
    // réplicas subindo juntas disputam o mesmo DDL num momento ruim. Lá o caminho é o
    // `npm run db:migrate` como passo deliberado do deploy.
    autoMigrate: data.DB_AUTO_MIGRATE ?? data.NODE_ENV !== 'production',
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
