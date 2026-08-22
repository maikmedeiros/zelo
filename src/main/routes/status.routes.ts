import { Router } from 'express';
import { controller } from '@shared/adapters/index.js';
import { makeFindStatusController } from '@main/factories/status/index.js';

/**
 * `status` não exige capability: qualquer ator autenticado pode consultar. Continua atrás
 * do `injectActor` (que é global), então `curl` sem credencial recebe 401 — para o
 * healthcheck do orquestrador, use uma api key dedicada.
 */
export default (router: Router): void => {
  router.get('/status', controller(makeFindStatusController()));
};
