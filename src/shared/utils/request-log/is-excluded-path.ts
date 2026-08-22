import { API_VERSION_PREFIX } from '@shared/utils/request-log/version-prefix.js';

/**
 * Regexes PRESAS ao prefixo de versão: sem a âncora, `/status` de qualquer outro
 * caminho também deixaria de ser logado. Rota nova que não deva ser logada entra aqui.
 */
/* eslint-disable security/detect-non-literal-regexp -- a única parte interpolada é a
   constante `API_VERSION_PREFIX`, texto do próprio código; nada de request entra aqui. */
const EXCLUDED = [
  new RegExp(`^${API_VERSION_PREFIX}/status/?$`),
  new RegExp(`^${API_VERSION_PREFIX}/health/?$`),
  /^\/metrics\/?$/,
  /^\/favicon\.ico$/,
  /^\/?$/,
  /^\/(assets|static|public)\//,
];
/* eslint-enable security/detect-non-literal-regexp */

export const isExcludedPath = (path: string): boolean =>
  EXCLUDED.some((pattern) => pattern.test(path));
