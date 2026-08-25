import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Express, Router } from 'express';
import { API_VERSION_PREFIX } from '@shared/utils/request-log/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PASTA_PUBLICA = 'publicas';

const ehPublica = (arquivo: string): boolean => arquivo.split(/[\\/]/)[0] === PASTA_PUBLICA;

const carregar = async (app: Express, publicas: boolean): Promise<void> => {
  const isCompiled = __dirname.includes('dist');
  const routesDir = resolve(__dirname, '../main/routes');

  if (!existsSync(routesDir)) return;

  const routeFileRegex = isCompiled ? /^[^.].*\.js$/ : /^[^.].*\.ts$/;

  const files = readdirSync(routesDir, { recursive: true, encoding: 'utf-8' })
    .filter(
      (file) =>
        routeFileRegex.test(file) && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'),
    )
    .filter((file) => ehPublica(file) === publicas);

  if (files.length === 0) return;

  const router = Router();
  app.use(API_VERSION_PREFIX, router);

  for (const file of files.sort()) {
    const route = await import(pathToFileURL(join(routesDir, file)).href);
    if (typeof route.default === 'function') route.default(router);
  }
};

export const setupPublicRoutes = (app: Express): Promise<void> => carregar(app, true);

export const setupPrivateRoutes = (app: Express): Promise<void> => carregar(app, false);
