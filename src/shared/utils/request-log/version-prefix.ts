/**
 * Prefixo de versão da API. Mora aqui (e não em `config/`) porque `isExcludedPath` é
 * consumido pelos middlewares, que não devem depender da composição global.
 */
export const API_VERSION_PREFIX = '/v1';
