import { API_VERSION_PREFIX } from '@shared/utils/request-log/version-prefix.js';

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
