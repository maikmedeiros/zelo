import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Express, Router } from 'express';
import { API_VERSION_PREFIX } from '@shared/utils/request-log/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async (app: Express): Promise<void> => {
  const router = Router();
  app.use(API_VERSION_PREFIX, router);

  const isCompiled = __dirname.includes('dist');
  const routesDir = resolve(__dirname, '../main/routes');

  // Sem arquivo de rota, o tsc não emite a pasta no dist — e um projeto sem rota nenhuma é
  // um estado válido enquanto o módulo está sendo reconstruído.
  if (!existsSync(routesDir)) return;
  const routeFileRegex = isCompiled ? /^[^.].*\.js$/ : /^[^.].*\.ts$/;

  const files = readdirSync(routesDir, { recursive: true, encoding: 'utf-8' }).filter(
    (file) => routeFileRegex.test(file) && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts'),
  );

  for (const file of files.sort()) {
    const route = await import(pathToFileURL(join(routesDir, file)).href);
    if (typeof route.default === 'function') route.default(router);
  }
};
