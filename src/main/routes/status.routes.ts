import { Router } from 'express';
import { controller } from '@shared/adapters/index.js';
import { makeFindStatusController } from '@main/factories/status/index.js';

export default (router: Router): void => {
  router.get('/status', controller(makeFindStatusController()));
};
